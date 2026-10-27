#!/usr/bin/env node
// test-handlers.mjs — permanent fixture gate for the hook handlers.
// Executable mirror of hooks/fixtures/README.md's expected-results table:
// every fixture is piped into its handler (cwd = repo root, exactly like the
// README instructs) and the documented stdout + exit 0 are asserted. Every
// handler is additionally checked against the fail-open contract (README
// note 3): malformed stdin must exit 0 with allow/empty output — never a
// deny/continue decision. keyword-detector state is isolated into a temp dir
// so a run leaves the working tree clean. Zero dependencies.
// Run: node scripts/test-handlers.mjs   (exit 0 = green, exit 1 = failures)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HANDLERS = path.join(ROOT, 'hooks', 'handlers');
const FIXTURES = path.join(ROOT, 'hooks', 'fixtures');

// Machine mirror of the hooks/fixtures/README.md expected-results table.
// expect: { includes } = stdout must contain the substring,
//         { empty: true } = stdout must be blank (after trim).
// kwGroup: fixtures sharing a group run in listed order against ONE temp
//          artifactDirectoryPath override (state isolation): `ulw` writes the
//          state file, `repeat` must then see it and stay silent.
const TESTS = [
  { fixture: 'write-guard-deny.json', handler: 'write-guard.mjs', expect: { includes: '"decision":"deny"' } },
  { fixture: 'write-guard-allow.json', handler: 'write-guard.mjs', expect: { includes: '"decision":"allow"' } },
  { fixture: 'write-guard-allow-escaped.json', handler: 'write-guard.mjs', expect: { includes: '"decision":"allow"' } },
  { fixture: 'write-guard-allow-fwdslash.json', handler: 'write-guard.mjs', expect: { includes: '"decision":"allow"' } },
  { fixture: 'context-injector-sessionstart.json', handler: 'context-injector.mjs', expect: { includes: '"injectSteps"' } },
  { fixture: 'stop-continuation-continue.json', handler: 'stop-continuation.mjs', expect: { includes: '"decision":"continue"' } },
  { fixture: 'stop-continuation-done.json', handler: 'stop-continuation.mjs', expect: { empty: true } },
  { fixture: 'stop-continuation-noplans.json', handler: 'stop-continuation.mjs', expect: { empty: true } },
  { fixture: 'session-notify-stop.json', handler: 'session-notify.mjs', expect: { empty: true } },
  { fixture: 'keyword-detector-ulw.json', handler: 'keyword-detector.mjs', expect: { includes: '"injectSteps"' }, kwGroup: 'kw' },
  { fixture: 'keyword-detector-repeat.json', handler: 'keyword-detector.mjs', expect: { empty: true }, kwGroup: 'kw' },
  { fixture: 'keyword-detector-none.json', handler: 'keyword-detector.mjs', expect: { empty: true } },
  { fixture: 'task-reminder-pending.json', handler: 'task-reminder.mjs', expect: { includes: '"injectSteps"' } },
  { fixture: 'task-reminder-done.json', handler: 'task-reminder.mjs', expect: { empty: true } },
  { fixture: 'ast-grep-provision.json', handler: 'ast-grep-provision.mjs', expect: { includes: '"injectSteps"' } },
  { fixture: 'readme-injector.json', handler: 'readme-injector.mjs', expect: { includes: '"injectSteps"' } },
  { fixture: 'readme-injector-none.json', handler: 'readme-injector.mjs', expect: { empty: true } },
  { fixture: 'agents-md-injector.json', handler: 'agents-md-injector.mjs', expect: { includes: '"injectSteps"' } },
  { fixture: 'agents-md-injector-none.json', handler: 'agents-md-injector.mjs', expect: { empty: true } },
];

const failures = [];
const kwDirs = new Map(); // kwGroup -> temp artifactDirectoryPath

function spawnHandler(handler, input) {
  return spawnSync(process.execPath, [path.join(HANDLERS, handler)], {
    input,
    cwd: ROOT, // fixtures use repo-relative paths (fixtures/README.md rule)
    encoding: 'utf8',
    timeout: 15000,
  });
}

// ── 1. fixture table ─────────────────────────────────────────────────────────
for (const t of TESTS) {
  let input;
  try {
    input = readFileSync(path.join(FIXTURES, t.fixture), 'utf8');
  } catch (e) {
    failures.push(`${t.fixture}: unreadable fixture: ${e.message}`);
    continue;
  }

  if (t.kwGroup) {
    // Override artifactDirectoryPath -> temp dir so no state lands in the repo.
    if (!kwDirs.has(t.kwGroup)) kwDirs.set(t.kwGroup, mkdtempSync(path.join(tmpdir(), 'omo-kw-state-')));
    try {
      const payload = JSON.parse(input);
      payload.artifactDirectoryPath = kwDirs.get(t.kwGroup);
      input = JSON.stringify(payload);
    } catch (e) {
      failures.push(`${t.fixture}: unparseable fixture JSON: ${e.message}`);
      continue;
    }
  }

  const r = spawnHandler(t.handler, input);
  const stdout = (r.stdout || '').trim();
  if (r.error || typeof r.status !== 'number') {
    failures.push(`${t.fixture}: spawn failed: ${r.error ? r.error.message : 'no exit status (timeout?)'}`);
    continue;
  }
  if (r.status !== 0) {
    failures.push(`${t.fixture}: exit ${r.status} (expected 0), stderr=${(r.stderr || '').trim().slice(0, 120)}`);
    continue;
  }
  if (t.expect.empty && stdout !== '') {
    failures.push(`${t.fixture}: expected empty stdout, got: ${stdout.slice(0, 140)}`);
  }
  if (t.expect.includes && !stdout.includes(t.expect.includes)) {
    failures.push(`${t.fixture}: expected stdout containing ${t.expect.includes}, got: ${stdout.slice(0, 160)}`);
  }
}

// ── 2. fail-open contract: malformed stdin for EVERY handler ────────────────
const handlers = [...new Set(TESTS.map((t) => t.handler))];
for (const h of handlers) {
  const r = spawnHandler(h, 'this is definitely not json {{{');
  const stdout = (r.stdout || '').trim();
  if (r.status !== 0) {
    failures.push(`fail-open/${h}: exit ${r.status} on malformed stdin (expected 0)`);
    continue;
  }
  if (stdout.includes('"decision":"deny"') || stdout.includes('"decision":"continue"')) {
    failures.push(`fail-open/${h}: malformed stdin produced a blocking/forcing decision: ${stdout.slice(0, 120)}`);
  } else if (stdout !== '' && !stdout.includes('"decision":"allow"')) {
    failures.push(`fail-open/${h}: malformed stdin produced unexpected stdout: ${stdout.slice(0, 120)}`);
  }
}

// ── cleanup ──────────────────────────────────────────────────────────────────
for (const d of kwDirs.values()) {
  try { rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ }
}

// ── verdict ──────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.log(`HANDLER FIXTURE GATE FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`HANDLER FIXTURE GATE PASSED (${TESTS.length} fixture tests + ${handlers.length} fail-open tests)`);
