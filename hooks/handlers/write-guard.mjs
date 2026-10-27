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

// Every spelling a transcript line may use for the same path. A JSONL
// transcript stores paths as JSON strings, so Windows backslashes appear
// JSON-escaped ("C:\\Users\\...") while the parsed payload arg has single
// ones; the same file may also be recorded with forward slashes or as a
// resolved absolute path. Matching every spelling only loosens the guard
// toward allow, which is fail-open safe (never tightens it).
function pathVariants(p) {
  const out = new Set();
  if (typeof p !== "string" || p.trim() === "") return out;
  out.add(p); // as received (single backslashes / forward slashes)
  out.add(p.split("\\").join("/")); // forward-slash form
  out.add(p.split("\\").join("\\\\")); // JSON-escaped backslash form
  return out;
}

// Tolerant transcript match: a JSONL line counts as a view_file record for the
// target path when the line contains the literal "view_file" and ANY spelling
// of the raw arg or its resolved absolute path (substring, not exact JSON
// field matching). Returns: true (record found), false (readable, no record),
// null (missing or unreadable transcript -> caller must fail open).
function transcriptHasViewFile(transcriptPath, targetPath, absPath) {
  if (!transcriptPath || typeof transcriptPath !== "string") return null;
  let raw;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return null; // unreadable transcript -> fail open
  }
  const needles = [...pathVariants(targetPath), ...pathVariants(absPath)];
  for (const line of raw.split("\n")) {
    if (!line.includes("view_file")) continue;
    for (const n of needles) {
      if (line.includes(n)) return true;
    }
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

const seen = transcriptHasViewFile(payload.transcriptPath, target, abs);
if (seen !== false) out(ALLOW); // record found, or transcript missing/unreadable -> fail open

out(DENY);
