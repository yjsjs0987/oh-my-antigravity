// omo task-reminder — port of OMO task-reminder (PreInvocation).
// On the first invocation of a turn, reminds the agent about pending work in
// the workspace: unchecked todo(s) in the newest .omo/plans/*.md, plus open
// notepad problem/issue files. Prints nothing when there is nothing pending.
// FAIL-OPEN MANDATORY: any error prints nothing and exits 0.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

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
if (payload.invocationNum !== 0) process.exit(0); // only at turn start

const ws = Array.isArray(payload.workspacePaths) ? payload.workspacePaths[0] : undefined;
if (typeof ws !== "string" || ws.trim() === "") process.exit(0);

const notes = [];

// newest .omo/plans/*.md unchecked count (same rule as stop-continuation)
try {
  const plansDir = join(ws, ".omo", "plans");
  const plans = readdirSync(plansDir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => {
      const p = join(plansDir, n);
      return { name: n, path: p, mtime: statSync(p).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  if (plans.length > 0) {
    const text = readFileSync(plans[0].path, "utf8");
    const unchecked = text.split(/\r?\n/).filter((l) => l.startsWith("- [ ] ")).length;
    if (unchecked > 0) notes.push(`${unchecked} unchecked todo(s) in .omo/plans/${plans[0].name}`);
  }
} catch {
  /* no plans dir -> nothing to remind */
}

// open notepad problem/issue files
try {
  const notepadsDir = join(ws, ".omo", "notepads");
  if (existsSync(notepadsDir)) {
    const open = [];
    for (const d of readdirSync(notepadsDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      for (const f of ["problems.md", "issues.md"]) {
        const p = join(notepadsDir, d.name, f);
        if (existsSync(p) && readFileSync(p, "utf8").trim() !== "") open.push(`.omo/notepads/${d.name}/${f}`);
      }
    }
    if (open.length > 0) notes.push(`open notepad notes: ${open.join(", ")}`);
  }
} catch {
  /* no notepads -> fine */
}

if (notes.length === 0) process.exit(0);

process.stdout.write(
  JSON.stringify({
    injectSteps: [
      {
        systemMessage: `Pending work reminder: ${notes.join("; ")}. Finish or explicitly defer this before starting unrelated work.`,
      },
    ],
  }),
);
process.exit(0);
