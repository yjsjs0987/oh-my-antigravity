#!/usr/bin/env node
// doctor.mjs — automatic diagnostics for the INSTALLED Antigravity integration.
// Run this when something feels broken; it checks the installed state against
// this repo's expected artifacts and reports [PASS]/[WARN]/[FAIL] per check.
//   Flags: --home <dir>, --repo (also run the repo structure validator)
// Exit code: 0 = healthy (warnings allowed), 1 = at least one FAIL.
// Zero dependencies: node builtins only.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { home: null, repo: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--home') args.home = argv[++i];
    else if (a === '--repo') args.repo = true;
    else { console.error(`Unknown argument: ${a}`); process.exit(2); }
  }
  return args;
}

function expandTildeArg(p) {
  if (typeof p === 'string' && (p.startsWith('~/') || p.startsWith('~\\'))) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').trim();
  // Empty file: Antigravity creates these fresh — report as "not configured"
  // (the callers turn null into a WARN about missing keys), not a parse error.
  if (raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { __parseError: true };
  }
}

const results = [];
function report(status, msg) {
  results.push({ status, msg });
  console.log(`[${status}] ${msg}`);
}
const pass = (m) => report('PASS', m);
const warn = (m) => report('WARN', m);
const fail = (m) => report('FAIL', m);

function main() {
  const args = parseArgs(process.argv);
  const home = path.resolve(args.home || os.homedir());
  const config = path.join(home, '.gemini', 'config');

  // 1. node version
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) pass(`node v${process.versions.node}`);
  else warn(`node v${process.versions.node} — v20+ recommended`);

  // 2. config dir
  if (fs.existsSync(config)) pass(`config dir exists: ${config}`);
  else {
    fail(`config dir missing: ${config} — run "node scripts\\install.mjs" first`);
  }

  // 3. skills
  const repoSkills = fs.readdirSync(path.join(REPO, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);
  const skillsDir = path.join(config, 'skills');
  if (fs.existsSync(skillsDir)) {
    const missing = repoSkills.filter((n) => !fs.existsSync(path.join(skillsDir, n, 'SKILL.md')));
    if (missing.length === 0) pass(`skills: all ${repoSkills.length} installed`);
    else fail(`skills missing SKILL.md (${missing.length}): ${missing.join(', ')}`);
  } else if (fs.existsSync(config)) {
    fail('skills: config\\skills does not exist — reinstall');
  }

  // 4. agents
  const repoAgents = fs.readdirSync(path.join(REPO, 'agents')).filter((f) => f.endsWith('.md'));
  const agentsDir = path.join(config, 'agents');
  const missingAgents = repoAgents.filter((n) => !fs.existsSync(path.join(agentsDir, n)));
  if (!fs.existsSync(agentsDir)) warn('agents: config\\agents does not exist — reinstall');
  else if (missingAgents.length === 0) pass(`agents: all ${repoAgents.length} installed`);
  else fail(`agents missing (${missingAgents.length}): ${missingAgents.join(', ')}`);

  // 5. rule
  if (fs.existsSync(path.join(config, 'rules', 'omo-port.md'))) pass('rule: omo-port.md installed');
  else warn('rule: rules\\omo-port.md not installed — reinstall');

  // 6. handlers: presence + syntax
  const repoHandlers = fs.readdirSync(path.join(REPO, 'hooks', 'handlers')).filter((f) => f.endsWith('.mjs'));
  const handlersDir = path.join(config, 'omo-handlers');
  if (!fs.existsSync(handlersDir)) fail('handlers: config\\omo-handlers does not exist — reinstall');
  else {
    const broken = [];
    for (const h of repoHandlers) {
      const p = path.join(handlersDir, h);
      if (!fs.existsSync(p)) { broken.push(`${h} (missing)`); continue; }
      const chk = spawnSync(process.execPath, ['--check', p], { timeout: 15000 });
      if (chk.status !== 0) broken.push(`${h} (syntax)`);
    }
    if (broken.length === 0) pass(`handlers: all ${repoHandlers.length} present and parse`);
    else fail(`handlers broken: ${broken.join(', ')}`);
  }

  // 7. mcp_config.json
  const mcpPath = path.join(config, 'mcp_config.json');
  const mcp = readJsonIfExists(mcpPath);
  if (!mcp) {
    warn('mcp_config.json missing, empty, or unparsable — MCP servers not registered');
  } else if (mcp.__parseError) {
    fail('mcp_config.json does not parse — fix the JSON (a backup *.omo-backup-*.json may exist)');
  } else {
    const servers = mcp.mcpServers || {};
    const ours = ['context7', 'grep_app', 'websearch', 'lsp', 'omo-git-bash'];
    const missingKeys = ours.filter((k) => servers[k] === undefined);
    if (missingKeys.length === 0) pass('mcp_config.json: all 5 keys registered');
    else warn(`mcp_config.json missing keys (${missingKeys.length}): ${missingKeys.join(', ')} — reinstall`);
    for (const k of ['lsp', 'omo-git-bash']) {
      const arg0 = servers[k] && Array.isArray(servers[k].args) ? servers[k].args[0] : undefined;
      if (typeof arg0 !== 'string') continue;
      const resolved = expandTildeArg(arg0);
      if (fs.existsSync(resolved)) pass(`mcp ${k}: entry file exists`);
      else warn(`mcp ${k}: entry file not found (${resolved}) — is oh-my-openagent still installed?`);
    }
  }

  // 8. hooks.json
  const hooksPath = path.join(config, 'hooks.json');
  const hooks = readJsonIfExists(hooksPath);
  if (!hooks) {
    warn('hooks.json missing, empty, or unparsable — hooks not registered');
  } else if (hooks.__parseError) {
    fail('hooks.json does not parse — fix the JSON (a backup *.omo-backup-*.json may exist)');
  } else {
    const expected = ['omo-write-guard', 'omo-context-injector', 'omo-session-notify', 'omo-stop-continuation',
      'omo-keyword-detector', 'omo-task-reminder', 'omo-ast-grep-provision', 'omo-readme-injector', 'omo-agents-md-injector'];
    const missingKeys = expected.filter((k) => hooks[k] === undefined);
    if (missingKeys.length === 0) pass(`hooks.json: all ${expected.length} omo-* keys registered`);
    else warn(`hooks.json missing keys (${missingKeys.length}): ${missingKeys.join(', ')} — reinstall`);
  }

  // 9. smoke: installed write-guard answers a benign payload
  const smokeHandler = path.join(config, 'omo-handlers', 'write-guard.mjs');
  const smokeFixture = path.join(REPO, 'hooks', 'fixtures', 'write-guard-allow.json');
  if (fs.existsSync(smokeHandler) && fs.existsSync(smokeFixture)) {
    const payload = fs.readFileSync(smokeFixture, 'utf8').replace(/^\uFEFF/, '');
    const r = spawnSync(process.execPath, [smokeHandler], { input: payload, timeout: 15000, encoding: 'utf8' });
    if (r.status === 0 && (r.stdout || '').includes('"decision":"allow"')) {
      pass('smoke: installed write-guard answers allow');
    } else {
      fail(`smoke: installed write-guard misbehaved (exit=${r.status}, stdout=${(r.stdout || '').trim().slice(0, 80)})`);
    }
  } else {
    warn('smoke: skipped (handler or fixture not found)');
  }

  // 10. repo validator (optional)
  if (args.repo) {
    const r = spawnSync(process.execPath, [path.join(REPO, 'scripts', 'validate.mjs')], { timeout: 120000, encoding: 'utf8' });
    if (r.status === 0) pass('repo validator: green');
    else fail('repo validator: violations found (run "node scripts\\validate.mjs" for details)');
  }

  // ---- summary ----
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  console.log('---');
  console.log(`Doctor: ${results.length - fails - warns} pass, ${warns} warning(s), ${fails} failure(s)`);
  if (fails > 0) {
    console.log('Fix: reinstall with "node scripts\\install.mjs", then re-run doctor.');
    process.exit(1);
  }
  console.log('Integration looks healthy.');
}

main();
