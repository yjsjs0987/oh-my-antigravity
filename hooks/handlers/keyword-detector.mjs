// omo keyword-detector — port of OMO keyword-detector/ultrawork (PreInvocation).
// Scans the conversation transcript for the entry keywords and injects the
// matching protocol as a system message. Supported keywords:
//   - bare "ulw" / "ultrawork"  -> workflow routing + certainty protocol
//   - "hyperplan" / "hpp"       -> five-role adversarial planning skill
//   - "team mode"               -> parallel role-based subagent procedure
// DEDUPE: one injection per keyword per conversation (state file), so neither
// the injected text nor the model's own replies can re-trigger a loop. The
// injected texts deliberately avoid the literal trigger keywords.
// FAIL-OPEN MANDATORY: any error prints nothing and exits 0.
import { readFileSync, writeFileSync, statSync, openSync, readSync, closeSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const PATTERNS = {
  ulw: /\b(?:ultrawork|ulw(?!-\w))\b/i,
  hyperplan: /\bhyperplan\b|(?<![\w.])hpp\b/i,
  team: /\bteam[\s_-]?mode\b/i,
};

// NOTE: none of these messages contain a literal trigger keyword — otherwise
// the transcript would re-trigger the detector on every invocation.
const MESSAGES = {
  ulw:
    "<workflow-boost>\n" +
    "WORKFLOW MODE ENABLED. Acknowledge the activation in your first response (do not repeat the trigger keyword itself).\n\n" +
    "Certainty protocol before ANY implementation:\n" +
    "1. Understand what the user ACTUALLY wants; explore the codebase first.\n" +
    "2. Not 100% certain? Fire explore/librarian subagents for context, consult oracle for hard calls, then ask the user.\n" +
    "3. Write a precise step-by-step plan before touching code.\n\n" +
    "Routing for workflow-family requests:\n" +
    '- a plan before implementation -> follow the "ulw-plan" skill\n' +
    '- running a written .omo/plans work plan -> follow the "ulw-execute" skill\n' +
    "- research / deep investigation -> follow the research skill\n" +
    "Ambiguous? Ask: plan, execute, or research.\n" +
    "</workflow-boost>",
  hyperplan:
    "<planning-boost>\n" +
    "ADVERSARIAL PLANNING MODE. Load the five-role adversarial planning skill from the skills catalog (skeptic, validator, researcher, architect, creative) and follow its FULL multi-round workflow — do not improvise, do not skip rounds, do not write the plan yourself.\n" +
    "</planning-boost>",
  team:
    "<teamwork-boost>\n" +
    "TEAM PROCEDURE: split this work into role-based parallel subagent calls (invoke_subagent), one role per call, then synthesize all results into a single deliverable. Track each role's outcome before synthesis.\n" +
    "</teamwork-boost>",
};

function out(json) {
  if (json) process.stdout.write(JSON.stringify(json));
  process.exit(0);
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Read at most the LAST 1MB of the transcript — transcripts grow unbounded.
function readTranscriptTail(p) {
  const MAX = 1_000_000;
  const size = statSync(p).size;
  if (size <= MAX) return readFileSync(p, "utf8");
  const fd = openSync(p, "r");
  try {
    const buf = Buffer.alloc(MAX);
    readSync(fd, buf, 0, MAX, size - MAX);
    return buf.toString("utf8");
  } finally {
    closeSync(fd);
  }
}

function stateDirOf(payload) {
  if (typeof payload.artifactDirectoryPath === "string" && payload.artifactDirectoryPath.trim() !== "") {
    return payload.artifactDirectoryPath;
  }
  const ws = Array.isArray(payload.workspacePaths) ? payload.workspacePaths[0] : undefined;
  if (typeof ws === "string" && ws.trim() !== "") return join(ws, ".omo", "hook-state");
  return null;
}

const stdin = readStdin().replace(/^\uFEFF/, "");
let payload;
try {
  payload = JSON.parse(stdin);
} catch {
  out(null); // malformed stdin -> fail open
}
if (!payload || typeof payload !== "object") out(null);

let text = "";
if (typeof payload.transcriptPath === "string" && payload.transcriptPath.trim() !== "") {
  try {
    text = readTranscriptTail(payload.transcriptPath);
  } catch {
    text = ""; // unreadable transcript -> no detection this round
  }
}

const dir = stateDirOf(payload);
const stateFile = dir ? join(dir, "keyword-detector-state.json") : null;
let state = { ulw: false, hyperplan: false, team: false };
if (stateFile && existsSync(stateFile)) {
  try {
    const saved = JSON.parse(readFileSync(stateFile, "utf8"));
    for (const k of Object.keys(state)) if (typeof saved[k] === "boolean") state[k] = saved[k];
  } catch {
    /* corrupt state -> treat as fresh */
  }
}

const steps = [];
for (const [key, pattern] of Object.entries(PATTERNS)) {
  if (!state[key] && pattern.test(text)) {
    steps.push({ systemMessage: MESSAGES[key] });
    state[key] = true; // one injection per keyword per conversation
  }
}

if (stateFile && steps.length > 0) {
  try {
    mkdirSync(dirname(stateFile), { recursive: true });
    writeFileSync(stateFile, JSON.stringify(state));
  } catch {
    /* state persistence is best-effort; injection already queued */
  }
}

out(steps.length > 0 ? { injectSteps: steps } : null);
