// omo write-guard — port of OMO write-existing-file-guard.
// Denies overwriting an EXISTING file that was never read (view_file) in this
// conversation. FAIL-OPEN MANDATORY: any uncertainty (parse error, missing
// transcript, unreadable file) prints {"decision":"allow"} and exits 0.
// Never crash, never block on uncertainty.
import { readFileSync, existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const ALLOW = '{"decision":"allow"}\n';
const DENY =
  '{"decision":"deny","reason":"Read the file before overwriting (omo write guard)"}\n';

function out(s) {
  process.stdout.write(s);
  process.exit(0);
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Known arg keys holding the target file path (case-sensitive, per contract).
const PATH_KEYS = ["path", "PathToCurrentFile", "file_path", "fileName"];

function findTargetPath(args) {
  if (!args || typeof args !== "object") return undefined;
  for (const k of PATH_KEYS) {
    const v = args[k];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return undefined;
}

// Tolerant transcript match: a JSONL line counts as a view_file record for the
// target path when the line contains both the literal "view_file" and the path
// string (substring, not exact JSON field matching). This may over-match (e.g.
// the path mentioned in an unrelated field alongside view_file) — acceptable:
// over-matching only loosens the guard toward allow, which is fail-open safe.
// Returns: true (record found), false (readable, no record), null (missing or
// unreadable transcript -> caller must fail open).
function transcriptHasViewFile(transcriptPath, targetPath) {
  if (!transcriptPath || typeof transcriptPath !== "string") return null;
  let raw;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return null; // unreadable transcript -> fail open
  }
  for (const line of raw.split("\n")) {
    if (line.includes("view_file") && line.includes(targetPath)) return true;
  }
  return false;
}

const stdin = readStdin().replace(/^\uFEFF/, ""); // tolerate UTF-8 BOM
let payload;
try {
  payload = JSON.parse(stdin);
} catch {
  out(ALLOW); // malformed stdin -> fail open
}
if (!payload || typeof payload !== "object") out(ALLOW);

const target = findTargetPath(payload.toolCall && payload.toolCall.args);
if (!target) out(ALLOW); // no recognizable path arg -> allow

// Resolve relative paths against the workspace root when possible.
const abs = isAbsolute(target)
  ? target
  : resolve(
      Array.isArray(payload.workspacePaths) && payload.workspacePaths[0]
        ? payload.workspacePaths[0]
        : process.cwd(),
      target,
    );

if (!existsSync(abs)) out(ALLOW); // new file -> allow

const seen = transcriptHasViewFile(payload.transcriptPath, target);
if (seen !== false) out(ALLOW); // record found, or transcript missing/unreadable -> fail open

out(DENY);
