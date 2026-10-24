// omo context-injector — port of OMO directory-agents-injector + rules-injector intent.
// SessionStart: one-time orientation message. PreInvocation(invocationNum===0):
// one-line skill-category reminder. Everything else: print NOTHING (empty
// stdout) and exit 0. Fail-open: parse errors -> empty stdout, exit 0.
import { readFileSync } from "node:fs";

const ORIENTATION =
  "OMO-for-AGY is installed. Skills are available as /<name> slash commands. " +
  "Delegate via ported subagents: sisyphus, oracle, librarian, explore, metis, " +
  "momus, atlas, multimodal-looker, prometheus, hephaestus, sisyphus-junior.";

const CATEGORIES =
  "Installed skill categories: dev, research, visual, ulw-workflow, team, maintenance.";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const stdin = readStdin().replace(/^\uFEFF/, ""); // tolerate UTF-8 BOM
let payload;
try {
  payload = JSON.parse(stdin);
} catch {
  process.exit(0); // fail open: empty stdout
}
if (!payload || typeof payload !== "object") process.exit(0);

// SessionStart payloads have no invocationNum; PreInvocation carries it.
if (payload.invocationNum === undefined || payload.invocationNum === null) {
  process.stdout.write(
    JSON.stringify({ injectSteps: [{ systemMessage: ORIENTATION }] }) + "\n",
  );
} else if (payload.invocationNum === 0) {
  process.stdout.write(
    JSON.stringify({ injectSteps: [{ systemMessage: CATEGORIES }] }) + "\n",
  );
}
// invocationNum > 0: print nothing, exit 0.
process.exit(0);
