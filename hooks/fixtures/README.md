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
| `keyword-detector-ulw.json` | `keyword-detector.mjs` | `{"injectSteps":[...]}` — workflow protocol injected for the bare keyword in `transcript-ulw.jsonl` |
| `keyword-detector-repeat.json` | `keyword-detector.mjs` | (empty stdout — state file marks the keyword already injected; delete `state-dir\` to re-test fresh) |
| `keyword-detector-none.json` | `keyword-detector.mjs` | (empty stdout — no transcript, fail-open) |
| `task-reminder-pending.json` | `task-reminder.mjs` | `{"injectSteps":[...]}` — "3 unchecked todo(s)" from `fake-workspace-todo` |
| `task-reminder-done.json` | `task-reminder.mjs` | (empty stdout — nothing pending) |
| `ast-grep-provision.json` | `ast-grep-provision.mjs` | `{"injectSteps":[...]}` — one-line availability notice (either branch) |
| `readme-injector.json` | `readme-injector.mjs` | `{"injectSteps":[...]}` — repo README head (workspace `.`) |
| `readme-injector-none.json` | `readme-injector.mjs` | (empty stdout — no README in `fake-workspace-done`) |
| `agents-md-injector.json` | `agents-md-injector.mjs` | `{"injectSteps":[...]}` — `fake-workspace-agents\AGENTS.md` head |
| `agents-md-injector-none.json` | `agents-md-injector.mjs` | (empty stdout — no AGENTS.md in `fake-workspace-done`) |

## Notes

- `transcript-sample.jsonl` is a synthetic 2-line transcript with no `view_file` record — that is what makes the deny fixture deny.
- `fake-workspace-todo/` and `fake-workspace-done/` are synthetic workspaces with a single plan file each, so the newest-plan selection is deterministic.
- Piping plain text (e.g. `Write-Output "not json" | node hooks\handlers\write-guard.mjs`) must always fail open: allow/empty output, exit 0.

Example:

```powershell
Get-Content hooks\fixtures\write-guard-deny.json -Raw | node hooks\handlers\write-guard.mjs
```
