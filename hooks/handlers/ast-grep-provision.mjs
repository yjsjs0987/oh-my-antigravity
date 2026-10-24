// omo ast-grep-provision — port of OMO ast-grep-sg-provision (PreInvocation).
// On the first invocation of a turn, checks whether the ast-grep `sg` binary
// is available and injects a one-line availability notice either way, so the
// agent knows whether the ast-grep skill's AST searches will work.
// FAIL-OPEN MANDATORY: any error prints nothing and exits 0.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

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
if (payload.invocationNum !== 0) process.exit(0); // once per turn

let msg;
try {
  const r = spawnSync("sg", ["--version"], { shell: true, timeout: 4000, encoding: "utf8" });
  const version = (r.stdout || "").trim().split(/\r?\n/)[0] || "";
  if (r.status === 0) {
    msg = `Tooling: ast-grep (sg) is available${version ? ` (${version})` : ""} — AST-shaped searches and rewrites from the ast-grep skill will work.`;
  } else {
    msg = "Tooling: ast-grep (sg) was NOT found — the ast-grep skill's AST searches will not work until it is installed (npm install -g @ast-grep/cli).";
  }
} catch {
  process.exit(0); // spawn unavailable -> fail open
}

process.stdout.write(JSON.stringify({ injectSteps: [{ systemMessage: msg }] }));
process.exit(0);
