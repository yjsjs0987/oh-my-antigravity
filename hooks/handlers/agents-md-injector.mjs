// omo agents-md-injector — port of OMO hephaestus-agents-md-injector
// (SessionStart), generalized: injects the head of the workspace AGENTS.md as
// a system message when the project maintains one. FAIL-OPEN: any error
// prints nothing and exits 0.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 4000;

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const stdin = readStdin().replace(/^\uFEFF/, "");
let payload;
try {
  payload = JSON.parse(stdin);
} catch {
  process.exit(0); // fail open
}
if (!payload || typeof payload !== "object") process.exit(0);

const ws = Array.isArray(payload.workspacePaths) ? payload.workspacePaths[0] : undefined;
if (typeof ws !== "string" || ws.trim() === "") process.exit(0);

let head;
try {
  const p = join(ws, "AGENTS.md");
  const size = statSync(p).size;
  let text = readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  if (size > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n... (truncated)";
  head = text.trim();
  if (head === "") process.exit(0);
} catch {
  process.exit(0); // no AGENTS.md -> nothing to inject
}

process.stdout.write(
  JSON.stringify({
    injectSteps: [{ systemMessage: `Workspace AGENTS.md (head) — project conventions for agents:\n\n${head}` }],
  }),
);
process.exit(0);
