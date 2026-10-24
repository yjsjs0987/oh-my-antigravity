#!/usr/bin/env node
// uninstall.mjs — removes ONLY this repo's artifacts from <home>/.gemini.
// Mirror of install.mjs: never touches other people's config.
//   Flags: --home <dir>, --dry-run
//   - skills: delete the dirs whose names match this repo's skills\ listing
//   - agents: delete the .md files matching repo agents\ listing
//   - rules/omo-port.md and omo-handlers\: delete
//   - hooks.json: remove our omo-* keys (keys from hooks\hooks.fragment.json)
//   - mcp_config.json: remove our 5 keys IF their value equals the
//     (tilde-expanded) fragment value; also remove omo-<key> conflict copies.
//     Every other key survives.
//   - *.omo-backup-*.json backups are left in place (reported, not deleted).
// Idempotent: a second run finds nothing to remove and exits 0.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { home: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--home') args.home = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else { console.error(`Unknown argument: ${a}`); process.exit(2); }
  }
  return args;
}

// Same tilde rule as install.mjs: `~` means the real user home (OMO location),
// never the --home target.
export function expandTilde(value, home = os.homedir()) {
  if (typeof value === 'string' && (value.startsWith('~/') || value.startsWith('~\\'))) {
    return path.normalize(path.join(home, value.slice(2)));
  }
  if (Array.isArray(value)) return value.map((v) => expandTilde(v, home));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = expandTilde(v, home);
    return out;
  }
  return value;
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function removeDirSync(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

// Our mcp keys to remove: ours-when-identical, plus any omo-<key> conflict copy.
export function computeMcpRemovals(existingServers, fragmentServers) {
  const remove = [];
  if (!existingServers || typeof existingServers !== 'object') return remove;
  for (const key of Object.keys(fragmentServers)) {
    if (existingServers[key] !== undefined &&
        JSON.stringify(existingServers[key]) === JSON.stringify(fragmentServers[key])) {
      remove.push(key); // unmodified copy of ours
    }
    const conflictKey = `omo-${key}`;
    if (existingServers[conflictKey] !== undefined) remove.push(conflictKey); // our conflict copy
  }
  return remove;
}

function main() {
  const args = parseArgs(process.argv);
  const home = path.resolve(args.home || os.homedir());
  const config = path.join(home, '.gemini', 'config');

  const skillNames = fs.readdirSync(path.join(REPO, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);
  const agentNames = fs.readdirSync(path.join(REPO, 'agents')).filter((f) => f.endsWith('.md'));
  const mcpFragment = expandTilde(JSON.parse(fs.readFileSync(path.join(REPO, 'mcp', 'mcp-config.fragment.json'), 'utf8')));
  const hooksFragment = JSON.parse(fs.readFileSync(path.join(REPO, 'hooks', 'hooks.fragment.json'), 'utf8'));

  const plan = { skillDirs: [], agentFiles: [], rule: false, handlersDir: false, mcpKeys: [], hookKeys: [] };

  for (const name of skillNames) {
    const p = path.join(config, 'skills', name);
    if (fs.existsSync(p)) plan.skillDirs.push(p);
  }
  for (const name of agentNames) {
    const p = path.join(config, 'agents', name);
    if (fs.existsSync(p)) plan.agentFiles.push(p);
  }
  const rule = path.join(config, 'rules', 'omo-port.md');
  if (fs.existsSync(rule)) plan.rule = true;
  const handlers = path.join(config, 'omo-handlers');
  if (fs.existsSync(handlers)) plan.handlersDir = true;

  const hooksPath = path.join(config, 'hooks.json');
  const hooksJson = readJsonIfExists(hooksPath);
  if (hooksJson) {
    for (const key of Object.keys(hooksFragment)) {
      if (hooksJson[key] !== undefined) plan.hookKeys.push(key);
    }
  }

  const mcpPath = path.join(config, 'mcp_config.json');
  const mcpJson = readJsonIfExists(mcpPath);
  if (mcpJson && mcpJson.mcpServers) {
    plan.mcpKeys = computeMcpRemovals(mcpJson.mcpServers, mcpFragment.mcpServers);
  }

  // ---- report ----
  console.log(args.dryRun ? 'DRY RUN — no files will be removed.' : 'Uninstalling OMO for Antigravity artifacts.');
  console.log(`Config root: ${config}`);
  console.log(`Skill dirs to remove: ${plan.skillDirs.length}`);
  console.log(`Agent files to remove: ${plan.agentFiles.length}`);
  console.log(`Rule to remove: ${plan.rule ? 1 : 0}`);
  console.log(`omo-handlers dir to remove: ${plan.handlersDir ? 1 : 0}`);
  console.log(`hooks.json keys to remove: ${plan.hookKeys.length ? plan.hookKeys.join(', ') : '(none)'}`);
  console.log(`mcp_config.json keys to remove: ${plan.mcpKeys.length ? plan.mcpKeys.join(', ') : '(none)'}`);
  const backups = fs.existsSync(config)
    ? fs.readdirSync(config).filter((f) => f.includes('.omo-backup-'))
    : [];
  if (backups.length) console.log(`Backups kept (delete manually if unwanted): ${backups.join(', ')}`);

  if (args.dryRun) return;

  // ---- execute ----
  for (const p of plan.skillDirs) removeDirSync(p);
  for (const p of plan.agentFiles) fs.rmSync(p, { force: true });
  if (plan.rule) fs.rmSync(rule, { force: true });
  if (plan.handlersDir) removeDirSync(handlers);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  if (plan.hookKeys.length > 0) {
    fs.copyFileSync(hooksPath, `${hooksPath}.omo-backup-${ts}.json`);
    for (const key of plan.hookKeys) delete hooksJson[key];
    fs.writeFileSync(hooksPath, JSON.stringify(hooksJson, null, 2));
  }
  if (plan.mcpKeys.length > 0) {
    fs.copyFileSync(mcpPath, `${mcpPath}.omo-backup-${ts}.json`);
    for (const key of plan.mcpKeys) delete mcpJson.mcpServers[key];
    fs.writeFileSync(mcpPath, JSON.stringify(mcpJson, null, 2));
  }

  console.log('Uninstall complete. Remaining artifacts are not ours — nothing else was touched.');
}

main();
