# Hook handler test fixtures

Sample stdin payloads for dry-testing the handlers under `hooks/handlers/`.
Payloads use **repo-relative paths** — run the handler tests **from the repository root**.

## Expected results (run from repo root)

| Fixture | Handler | Expected stdout / exit |
| --- | --- | --- |
| `write-guard-deny.json` | `write-guard.mjs` | `{"decision":"deny",...}` (target exists, transcript has no view_file record) |
| `write-guard-allow.json` | `write-guard.mjs` | `{"decision":"allow"}` (no transcriptPath → fail-open) |
| `context-injector-sessionstart.json` | `context-injector.mjs` | `{"injectSteps":[...]}` (SessionStart orientation) |
| `stop-continuation-continue.json` | `stop-continuation.mjs` | `{"decision":"continue","reason":"3 unchecked todo(s) in active plan"}` |
| `stop-continuation-done.json` | `stop-continuation.mjs` | (empty stdout — all boxes checked, exit allowed) |
| `stop-continuation-noplans.json` | `stop-continuation.mjs` | (empty stdout — no `.omo/plans` under `hooks/fixtures`, exit allowed) |
| `session-notify-stop.json` | `session-notify.mjs` | (empty stdout, exit code 0 — one beep, never blocks) |

## Notes

- `transcript-sample.jsonl` is a synthetic 2-line transcript with no `view_file` record — that is what makes the deny fixture deny.
- `fake-workspace-todo/` and `fake-workspace-done/` are synthetic workspaces with a single plan file each, so the newest-plan selection is deterministic.
- Piping plain text (e.g. `Write-Output "not json" | node hooks\handlers\write-guard.mjs`) must always fail open: allow/empty output, exit 0.

Example:

```powershell
Get-Content hooks\fixtures\write-guard-deny.json -Raw | node hooks\handlers\write-guard.mjs
```
