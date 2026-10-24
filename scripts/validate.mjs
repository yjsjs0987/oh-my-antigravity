#!/usr/bin/env node
// validate.mjs — single structure-validation entrypoint for the OMO→Antigravity port.
// Zero dependencies. Run: node scripts/validate.mjs  (exit 0 = green, exit 1 = violations)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Machine-portable resolution of the OMO install location (was a hardcoded
// personal absolute path; `~`-style relative to the real user home).
const OMO_HOOKS_DIR = path.join(os.homedir(), '.cache', 'opencode', 'packages', 'oh-my-openagent@latest', 'node_modules', 'oh-my-openagent', 'dist', 'hooks');

// Expand a leading `~/` against the real user home (same rule as install.mjs).
function expandTildeArg(p) {
  if (typeof p === 'string' && (p.startsWith('~/') || p.startsWith('~\\'))) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

const TOOL_WHITELIST = new Set([
  'view_file', 'write_to_file', 'replace_file_content', 'multi_replace_file_content',
  'grep_search', 'find_by_name', 'list_dir', 'run_command', 'search_web',
  'read_url_content', 'invoke_subagent', 'manage_task', 'schedule',
]);
const MODELS = new Set(['inherit', 'flash', 'pro']);
const CEP = new Set(['off', 'auto', 'eager', 'sandbox']);
const BOOLS = new Set(['true', 'false']);
const HOOK_EVENTS = new Set(['SessionStart', 'PreToolUse', 'PostToolUse', 'PreInvocation', 'PostInvocation', 'Stop']);
const TRIGGERS = new Set(['always_on', 'model_decision', 'glob', 'manual']);

// Hardcoded fallback copy of MAPPING.md "FORBIDDEN TOKENS" (14 patterns).
const FORBIDDEN_FALLBACK = [
  'task(subagent_type', 'task(category', 'background_output(', 'skill(name=',
  'todowrite', 'interactive_bash', 'LspDiagnostics', 'LspFormat', 'LspGotoDefinition',
  'LspFindReferences', 'lsp_diagnostics', 'team_create(', 'team_send_message(', 'team_delete(',
];

function read(p) { return fs.readFileSync(p, 'utf8'); }

// Parse frontmatter between the first two --- lines. Returns { data: Map, body, ok }.
function frontmatter(text) {
  if (!text.startsWith('---')) return { data: new Map(), body: text, ok: false };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { data: new Map(), body: text, ok: false };
  const block = text.slice(3, end).replace(/^\r?\n/, '');
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  const data = new Map();
  let currentKey = null;
  for (const line of block.split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentKey) {
      const arr = data.get(currentKey);
      if (Array.isArray(arr)) arr.push(listItem[1].trim());
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      let v = kv[2].trim();
      if (v === '') { data.set(currentKey, []); continue; }
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      data.set(currentKey, v);
    } else {
      currentKey = null;
    }
  }
  return { data, body, ok: true };
}

// Extract the 14 forbidden patterns from MAPPING.md's fenced code block; fallback on failure.
function loadForbiddenPatterns() {
  try {
    const mapping = read(path.join(ROOT, 'MAPPING.md'));
    const section = mapping.slice(mapping.indexOf('## FORBIDDEN TOKENS'));
    const fence = section.indexOf('```');
    const fenceEnd = section.indexOf('```', fence + 3);
    if (fence !== -1 && fenceEnd !== -1) {
      const patterns = section.slice(fence + 3, fenceEnd).split(/\r?\n/)
        .map((l) => l.trim()).filter(Boolean);
      if (patterns.length > 0) return { patterns, source: 'MAPPING.md' };
    }
  } catch { /* fall through */ }
  return { patterns: FORBIDDEN_FALLBACK, source: 'hardcoded fallback' };
}

function walkFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

const warnings = [];
const suites = []; // { name, violations: [] }
function suite(name) { const s = { name, violations: [] }; suites.push(s); return s; }

// ── (a) skills ──────────────────────────────────────────────────────────────
function validateSkills(forbidden) {
  const s = suite('skills');
  const skillsDir = path.join(ROOT, 'skills');
  const dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  if (dirs.length !== 31) s.violations.push(`skills: expected 31 skill directories, found ${dirs.length}`);
  for (const dir of dirs) {
    const skillMd = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) { s.violations.push(`skills/${dir}: missing SKILL.md`); continue; }
    const { data, ok } = frontmatter(read(skillMd));
    if (!ok) { s.violations.push(`skills/${dir}: SKILL.md has no frontmatter block`); continue; }
    const desc = data.get('description');
    if (desc === undefined || desc === '' || Array.isArray(desc)) {
      s.violations.push(`skills/${dir}: frontmatter missing 'description:'`);
    } else if (desc.length > 1024) {
      s.violations.push(`skills/${dir}: description is ${desc.length} chars (max 1024)`);
    }
  }
  // Forbidden token scan over ALL files in all skill dirs.
  for (const file of walkFiles(skillsDir)) {
    let text;
    try { text = read(file); } catch (e) { s.violations.push(`skills: unreadable ${path.relative(ROOT, file)}: ${e.message}`); continue; }
    for (const pat of forbidden) {
      if (text.includes(pat)) {
        s.violations.push(`skills/${path.relative(skillsDir, file)}: forbidden token "${pat}"`);
      }
    }
  }
}

// ── (b) agents ──────────────────────────────────────────────────────────────
function validateAgents() {
  const s = suite('agents');
  const agentsDir = path.join(ROOT, 'agents');
  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  if (files.length !== 11) s.violations.push(`agents: expected 11 .md files, found ${files.length}`);
  for (const file of files) {
    const { data, ok } = frontmatter(read(path.join(agentsDir, file)));
    if (!ok) { s.violations.push(`agents/${file}: no frontmatter block`); continue; }
    if (!data.get('name')) s.violations.push(`agents/${file}: frontmatter missing 'name:'`);
    if (!data.get('description')) s.violations.push(`agents/${file}: frontmatter missing 'description:'`);
    const tools = data.get('tools');
    if (Array.isArray(tools)) {
      for (const t of tools) {
        if (!TOOL_WHITELIST.has(t)) s.violations.push(`agents/${file}: tool "${t}" not in whitelist`);
      }
    } else if (tools !== undefined) {
      s.violations.push(`agents/${file}: 'tools' is not a list`);
    }
    const model = data.get('model');
    if (model !== undefined && !MODELS.has(model)) s.violations.push(`agents/${file}: model "${model}" not in {inherit,flash,pro}`);
    const cep = data.get('commandExecutionPolicy');
    if (cep !== undefined && !CEP.has(cep)) s.violations.push(`agents/${file}: commandExecutionPolicy "${cep}" not in {off,auto,eager,sandbox}`);
    for (const key of ['mainAgent', 'subagent']) {
      const v = data.get(key);
      if (v !== undefined && !BOOLS.has(v)) s.violations.push(`agents/${file}: ${key} "${v}" not in {true,false}`);
    }
  }
}

// ── (c) mcp fragment ────────────────────────────────────────────────────────
function validateMcp() {
  const s = suite('mcp');
  const file = path.join(ROOT, 'mcp', 'mcp-config.fragment.json');
  let json;
  try { json = JSON.parse(read(file)); } catch (e) { s.violations.push(`mcp: fragment does not parse: ${e.message}`); return; }
  if (!json || typeof json !== 'object' || !json.mcpServers || typeof json.mcpServers !== 'object') {
    s.violations.push('mcp: top-level structure must be {"mcpServers":{...}}');
    return;
  }
  for (const [name, entry] of Object.entries(json.mcpServers)) {
    const hasCommand = entry.command !== undefined;
    const hasUrl = entry.serverUrl !== undefined;
    if (hasCommand === hasUrl) {
      s.violations.push(`mcp/${name}: must have EXACTLY ONE of command|serverUrl (has ${hasCommand && hasUrl ? 'both' : 'neither'})`);
      continue;
    }
    if (hasCommand && Array.isArray(entry.args)) {
      for (const arg of entry.args) {
        const resolved = expandTildeArg(arg);
        if (typeof resolved === 'string' && path.isAbsolute(resolved) && !fs.existsSync(resolved)) {
          s.violations.push(`mcp/${name}: absolute arg path does not exist: ${resolved}`);
        }
      }
    }
  }
}

// ── (d) hooks fragment ──────────────────────────────────────────────────────
function validateHooks() {
  const s = suite('hooks');
  const file = path.join(ROOT, 'hooks', 'hooks.fragment.json');
  let json;
  try { json = JSON.parse(read(file)); } catch (e) { s.violations.push(`hooks: fragment does not parse: ${e.message}`); return; }
  const handlers = new Set();
  for (const [hookName, events] of Object.entries(json)) {
    if (!events || typeof events !== 'object') { s.violations.push(`hooks/${hookName}: value must be an object of event → entries`); continue; }
    for (const [event, entries] of Object.entries(events)) {
      if (!HOOK_EVENTS.has(event)) { s.violations.push(`hooks/${hookName}: invalid event key "${event}"`); continue; }
      if (!Array.isArray(entries)) { s.violations.push(`hooks/${hookName}/${event}: entries must be an array`); continue; }
      for (const entry of entries) {
        if (entry.matcher !== undefined && (event === 'PreToolUse' || event === 'PostToolUse')) {
          try { new RegExp(entry.matcher); } catch (e) {
            s.violations.push(`hooks/${hookName}/${event}: matcher regex does not compile: ${e.message}`);
          }
        }
        const cmd = typeof entry.command === 'string' ? entry.command : '';
        const handlerToken = cmd.split(/\s+/).filter(Boolean).pop();
        if (handlerToken && handlerToken.endsWith('.mjs')) {
          const handlerPath = path.join(ROOT, 'hooks', 'handlers', path.basename(handlerToken));
          if (!fs.existsSync(handlerPath)) {
            s.violations.push(`hooks/${hookName}/${event}: handler file missing: hooks/handlers/${path.basename(handlerToken)}`);
          } else {
            handlers.add(handlerPath);
          }
        }
      }
    }
  }
  // node --check each unique handler (bounded: one spawn per handler file).
  for (const handler of handlers) {
    const r = spawnSync(process.execPath, ['--check', handler], { encoding: 'utf8' });
    if (r.status !== 0) {
      s.violations.push(`hooks: node --check failed for ${path.relative(ROOT, handler)}: ${(r.stderr || '').trim()}`);
    }
  }
}

// ── (e) rules ───────────────────────────────────────────────────────────────
function validateRules() {
  const s = suite('rules');
  const rulesDir = path.join(ROOT, 'rules');
  const files = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md')) : [];
  if (!fs.existsSync(path.join(rulesDir, 'omo-port.md'))) {
    warnings.push('rules: rules/omo-port.md not found (expected from todo 16) — WARNING, not a failure');
  }
  for (const file of files) {
    const text = read(path.join(rulesDir, file));
    if (text.length > 12000) s.violations.push(`rules/${file}: ${text.length} chars (max 12000)`);
    const { data } = frontmatter(text);
    const trigger = data.get('trigger');
    if (trigger !== undefined && !TRIGGERS.has(trigger)) {
      s.violations.push(`rules/${file}: trigger "${trigger}" not in {always_on,model_decision,glob,manual}`);
    }
  }
}

// ── (f) NOT-PORTED.md hook table vs OMO hooks dir ───────────────────────────
function validateNotPorted() {
  const s = suite('not-ported');
  let dirCount;
  try {
    dirCount = fs.readdirSync(OMO_HOOKS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  } catch {
    warnings.push(`not-ported: OMO hooks dir unreadable (${OMO_HOOKS_DIR}) — WARNING, not a failure`);
    return;
  }
  const text = read(path.join(ROOT, 'NOT-PORTED.md'));
  // Table rows: first cell starts with an alphanumeric name (excludes | --- | separators).
  const rows = text.split(/\r?\n/).filter((l) => /^\|\s*[a-zA-Z0-9][a-zA-Z0-9._-]*\s*\|/.test(l)).length;
  if (rows !== dirCount) {
    s.violations.push(`not-ported: hook table has ${rows} rows but OMO hooks dir has ${dirCount} directories`);
  }
}

// ── main ────────────────────────────────────────────────────────────────────
const { patterns, source } = loadForbiddenPatterns();
console.log(`Forbidden patterns: ${patterns.length} loaded from ${source}`);
validateSkills(patterns);
validateAgents();
validateMcp();
validateHooks();
validateRules();
validateNotPorted();

let failed = false;
for (const s of suites) {
  const status = s.violations.length === 0 ? 'PASS' : 'FAIL';
  if (s.violations.length > 0) failed = true;
  console.log(`[${status}] ${s.name}${s.violations.length ? ` (${s.violations.length} violation${s.violations.length > 1 ? 's' : ''})` : ''}`);
}
for (const w of warnings) console.log(`[WARN] ${w}`);
console.log('---');
if (failed) {
  console.log('VALIDATION FAILED — violations:');
  for (const s of suites) for (const v of s.violations) console.log(`  - ${v}`);
  process.exit(1);
}
console.log(`ALL SUITES PASSED (${suites.length} suites, ${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
process.exit(0);
