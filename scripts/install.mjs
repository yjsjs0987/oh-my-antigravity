#!/usr/bin/env node
// OMO for Antigravity — one-shot installer.
// Copies this repo's ported artifacts into <home>/.gemini/config/ (and optionally
// <home>/.gemini/antigravity-cli/skills/). Zero dependencies: node builtins only.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- args ----------
function parseArgs(argv) {
  const args = { home: null, cli: false, dryRun: false, noValidate: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--home') args.home = argv[++i];
    else if (a === '--cli') args.cli = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-validate') args.noValidate = true;
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

// ---------- path safety ----------
// Every write target must live under <home>/.gemini — refuse anything else.
export function assertUnderHome(target, homeRoot) {
  const t = path.resolve(target);
  const r = path.resolve(homeRoot);
  if (t !== r && !t.startsWith(r + path.sep)) {
    throw new Error(`Path escape refused: ${t} is not under ${r}`);
  }
}

export function computeTargets(home) {
  const gemini = path.join(home, '.gemini');
  const config = path.join(gemini, 'config');
  return {
    gemini,
    config,
    skills: path.join(config, 'skills'),
    agents: path.join(config, 'agents'),
    rules: path.join(config, 'rules'),
    handlers: path.join(config, 'omo-handlers'),
    mcpConfig: path.join(config, 'mcp_config.json'),
    hooksConfig: path.join(config, 'hooks.json'),
    cliSkills: path.join(gemini, 'antigravity-cli', 'skills'),
  };
}

// ---------- json ----------
function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  // strip UTF-8 BOM — Windows editors/tools commonly write one
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

// Set ONLY our omo-* keys; leave every other existing key untouched.
export function mergeHooks(existing, fragment) {
  const out = existing ?? {};
  for (const key of Object.keys(fragment)) out[key] = fragment[key];
  return out;
}

// Set our 5 mcp keys; if an existing key holds a DIFFERENT value, save ours
// under `omo-<key>` instead and report a warning.
export function mergeMcp(existing, fragment) {
  const out = existing ?? {};
  if (!out.mcpServers || typeof out.mcpServers !== 'object') out.mcpServers = {};
  const warnings = [];
  for (const [key, value] of Object.entries(fragment.mcpServers)) {
    const current = out.mcpServers[key];
    if (current !== undefined && JSON.stringify(current) !== JSON.stringify(value)) {
      out.mcpServers[`omo-${key}`] = value;
      warnings.push(`mcpServers.${key} already exists with a different value — our config saved as mcpServers.omo-${key}`);
    } else {
      out.mcpServers[key] = value;
    }
  }
  return { out, warnings };
}

// ---------- copy ----------
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ---------- main ----------
function main() {
  const args = parseArgs(process.argv);
  const home = path.resolve(args.home || os.homedir());
  const t = computeTargets(home);
  const homeRoot = path.join(home, '.gemini');
  for (const p of Object.values(t)) assertUnderHome(p, homeRoot);

  // inventory
  const skillDirs = fs.readdirSync(path.join(REPO, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);
  const agentFiles = fs.readdirSync(path.join(REPO, 'agents')).filter((f) => f.endsWith('.md'));
  const handlerFiles = fs.readdirSync(path.join(REPO, 'hooks', 'handlers')).filter((f) => f.endsWith('.mjs'));
  const ruleSrc = path.join(REPO, 'rules', 'omo-port.md');
  const hasRule = fs.existsSync(ruleSrc);
  const mcpFragment = JSON.parse(fs.readFileSync(path.join(REPO, 'mcp', 'mcp-config.fragment.json'), 'utf8'));
  const hooksFragment = JSON.parse(fs.readFileSync(path.join(REPO, 'hooks', 'hooks.fragment.json'), 'utf8'));

  if (args.dryRun) {
    console.log('DRY RUN — no files will be written.');
    console.log(`Home: ${home}`);
    console.log(`Config root: ${t.config}`);
    console.log(`skills: ${skillDirs.length} dirs -> ${t.skills}`);
    console.log(`agents: ${agentFiles.length} files -> ${t.agents}`);
    console.log(`rules: ${hasRule ? 1 : 0} file(s) -> ${t.rules}${hasRule ? '' : ' (rules/omo-port.md not present yet — skipped)'}`);
    console.log(`omo-handlers: ${handlerFiles.length} files -> ${t.handlers}`);
    console.log(`mcp_config.json merge keys: ${Object.keys(mcpFragment.mcpServers).join(', ')}`);
    console.log(`hooks.json merge keys: ${Object.keys(hooksFragment).join(', ')}`);
    if (args.cli) console.log(`cli skills: ${skillDirs.length} dirs -> ${t.cliSkills}`);
    console.log('validate: skipped (--dry-run)');
    return 0;
  }

  // backup existing configs BEFORE merging
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const p of [t.mcpConfig, t.hooksConfig]) {
    if (fs.existsSync(p)) {
      const backup = p.replace(/\.json$/, '') + `.omo-backup-${stamp}.json`;
      fs.copyFileSync(p, backup);
      console.log(`Backup: ${p} -> ${backup}`);
    }
  }

  // merges
  fs.mkdirSync(t.config, { recursive: true });
  fs.writeFileSync(t.hooksConfig, JSON.stringify(mergeHooks(readJsonIfExists(t.hooksConfig), hooksFragment), null, 2) + '\n');
  const { out: mcpOut, warnings } = mergeMcp(readJsonIfExists(t.mcpConfig), mcpFragment);
  fs.writeFileSync(t.mcpConfig, JSON.stringify(mcpOut, null, 2) + '\n');
  for (const w of warnings) console.warn(`WARNING: ${w}`);

  // copies (overwrite same-name files — they are ours; never touch anything else)
  fs.mkdirSync(t.skills, { recursive: true });
  for (const name of skillDirs) copyDir(path.join(REPO, 'skills', name), path.join(t.skills, name));
  fs.mkdirSync(t.agents, { recursive: true });
  for (const f of agentFiles) fs.copyFileSync(path.join(REPO, 'agents', f), path.join(t.agents, f));
  if (hasRule) {
    fs.mkdirSync(t.rules, { recursive: true });
    fs.copyFileSync(ruleSrc, path.join(t.rules, 'omo-port.md'));
  } else {
    console.log('Note: rules/omo-port.md not present yet — skipping rules copy.');
  }
  fs.mkdirSync(t.handlers, { recursive: true });
  for (const f of handlerFiles) fs.copyFileSync(path.join(REPO, 'hooks', 'handlers', f), path.join(t.handlers, f));
  if (args.cli) {
    fs.mkdirSync(t.cliSkills, { recursive: true });
    for (const name of skillDirs) copyDir(path.join(REPO, 'skills', name), path.join(t.cliSkills, name));
  }

  console.log(`Installed: ${skillDirs.length} skills, ${agentFiles.length} agents, ${handlerFiles.length} handlers -> ${t.config}`);

  // validate
  if (!args.noValidate) {
    const validate = path.join(REPO, 'scripts', 'validate.mjs');
    if (!fs.existsSync(validate)) {
      console.log('Note: scripts/validate.mjs not present yet — skipping validation.');
      return 0;
    }
    const r = spawnSync(process.execPath, [validate], { stdio: 'inherit' });
    return r.status ?? 1;
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exitCode = main();
