// Antigravity hook handler: stop-continuation (Stop event)
// Contract: stdin = camelCase JSON payload. If the newest .omo/plans/*.md in
// workspacePaths[0] has unchecked `- [ ] ` lines, print
// {"decision":"continue","reason":"<N> unchecked todo(s) in active plan"} to
// resume the agent. Otherwise print NOTHING (empty stdout = exit allowed).
// FAIL-OPEN everywhere: missing plans dir, no plan files, parse errors, missing
// workspacePaths -> print nothing, exit 0. NEVER continue unconditionally.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input.replace(/^\uFEFF/, "").trim());
    const workspace = Array.isArray(payload?.workspacePaths) ? payload.workspacePaths[0] : undefined;
    if (workspace) {
      const plansDir = join(workspace, ".omo", "plans");
      const plans = readdirSync(plansDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => {
          const path = join(plansDir, name);
          return { path, mtime: statSync(path).mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime);
      if (plans.length > 0) {
        const text = readFileSync(plans[0].path, "utf8");
        const unchecked = text.split(/\r?\n/).filter((line) => line.startsWith("- [ ] ")).length;
        if (unchecked > 0) {
          process.stdout.write(
            JSON.stringify({ decision: "continue", reason: `${unchecked} unchecked todo(s) in active plan` }),
          );
        }
      }
    }
  } catch { /* fail-open: print nothing */ }
  process.exit(0);
});
