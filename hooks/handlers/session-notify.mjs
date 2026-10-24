// Antigravity hook handler: session-notify (SessionStart / Stop)
// Contract: stdin = camelCase JSON payload (tolerate anything). Fire ONE Windows
// beep, print NOTHING to stdout, exit 0 ALWAYS. Empty stdout = exit allowed on
// Stop; nothing injected on SessionStart. No deps, no Toast modules.
import { spawn } from "node:child_process";

// Drain stdin so the host never sees EPIPE; payload content is irrelevant here.
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try { JSON.parse(input.replace(/^\uFEFF/, "").trim()); } catch { /* tolerate anything */ }

  // Fire-and-forget beep; spawn failure must not crash the handler.
  try {
    const child = spawn(
      "powershell",
      ["-NoProfile", "-Command", "[console]::beep(880,200)"],
      { stdio: "ignore", detached: true, windowsHide: true },
    );
    child.on("error", () => {});
    child.unref();
  } catch { /* ignore */ }

  process.exit(0);
});
