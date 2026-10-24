# OMO for Antigravity

> **NOTICE — Derivative work.** This repository is a port of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v5.1.40 (© YeonGyu-Kim). Skill and agent content is largely copied from the upstream project and modified for Google Antigravity. It is distributed free of charge for non-commercial use under the upstream **Sustainable Use License (SUL-1.0)** — see [LICENSE](./LICENSE) for the full terms. This is a source-available license, not an OSI open-source license.

**Use your OMO (oh-my-openagent) workflows inside Google Antigravity.** The same 32 skills, 11 subagents, curated MCP servers, and safety hooks you had in OpenCode — installed as native Antigravity global customizations with a one-line installer. Your `/slash-command` muscle memory, delegation habits, and read-before-overwrite guardrails all carry over.

Built for: OMO users switching to Antigravity. The OpenCode-side OMO package is **never modified** — both can run side by side during the transition.

## Highlights

| | |
| --- | --- |
| **32 skills** | dev (10) · research/visual (5) · ulw workflow (4) · team (5) · maintenance (8) — every skill is also a `/<name>` slash command |
| **11 subagents** | sisyphus (orchestration lead, mainAgent), hephaestus, sisyphus-junior, oracle, librarian, explore, metis, momus, atlas, multimodal-looker, prometheus |
| **5 MCP servers** | context7 (library docs), grep_app (real-world code search), websearch, lsp (diagnostics/rename/symbols), omo-git-bash |
| **4 hooks** | omo-write-guard (read before overwrite), omo-context-injector (session orientation), omo-session-notify (beep on start/finish), omo-stop-continuation (keeps the agent going until the plan is done) |
| **Tooling** | idempotent installer + full structure validator — zero npm dependencies |

## Quick start

```powershell
node scripts\install.mjs
```

Restart Antigravity. Then:

- Type `/git-master`, `/debugging`, `/ulw-plan`, `/security-research` — any skill name works as a slash command.
- Type `ulw` (the ultrawork entry keyword) — the `ulw` router skill routes you to plan / execute / research.
- Delegate as usual — the ported subagents are invocable by name.

## The ulw workflow entry point

`ulw` (ultrawork) is the shared keyword of the OMO workflow family. In this port, a dedicated `ulw` router skill handles the bare keyword and the `/ulw` command:

- plan before implementation → `ulw-plan`
- run a written `.omo/plans` work plan → `ulw-execute`
- research / deep investigation → `ulw-research`
- ambiguous → the router asks you which one

## What gets installed (and where)

| Artifact | Path (under your user home) |
| --- | --- |
| 32 skills | `~\.gemini\config\skills\<name>\SKILL.md` |
| 11 agents | `~\.gemini\config\agents\<name>.md` |
| 1 rule | `~\.gemini\config\rules\omo-port.md` |
| 4 hook handlers | `~\.gemini\config\omo-handlers\*.mjs` |
| 5 MCP registrations | merged into `~\.gemini\config\mcp_config.json` |
| 4 hook registrations | merged into `~\.gemini\config\hooks.json` |

Existing `mcp_config.json` / `hooks.json` are **backed up as `*.omo-backup-<timestamp>.json` before merging** — only our keys are added, everything else is left untouched. Conflicting keys of yours are preserved; ours are saved under an `omo-<key>` name instead.

## Install

```powershell
node scripts\install.mjs
```

Flags:

- `--home <dir>` — install into a custom home (used for testing).
- `--cli` — additionally copy skills into `~\.gemini\antigravity-cli\skills\` for the Antigravity CLI.
- `--dry-run` — print the install plan (file counts, merge keys) without writing anything.
- `--no-validate` — skip the automatic structure validation at the end.

The installer is idempotent: re-running produces the same tree.

## Validate

```powershell
node scripts\validate.mjs
```

Zero dependencies. Exits 0 when all suites pass (skills, agents, MCP, hooks, rules, NOT-PORTED row count) and prints a summary table; exits 1 with a violation list otherwise. The installer runs this automatically at the end unless `--no-validate` is passed.

## Uninstall

There is no uninstall script — remove the ported artifacts manually (or restore from the installer's backups).

**1. Files and directories** (PowerShell, run from the repo root — removes ONLY our artifacts):

```powershell
$cfg = Join-Path $HOME ".gemini\config"
# our 32 skill directories (names = this repo's skills\ folder)
Get-ChildItem skills -Directory | ForEach-Object {
  Remove-Item (Join-Path $cfg "skills\$($_.Name)") -Recurse -Force -ErrorAction SilentlyContinue
}
# agents, rule, handlers
Get-ChildItem agents -Filter *.md | ForEach-Object {
  Remove-Item (Join-Path $cfg "agents\$($_.Name)") -Force -ErrorAction SilentlyContinue
}
Remove-Item (Join-Path $cfg "rules\omo-port.md") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $cfg "omo-handlers") -Recurse -Force -ErrorAction SilentlyContinue
```

**2. JSON keys** — open the two config files and delete only our keys:

- `~\.gemini\config\hooks.json`: remove the 4 `omo-*` keys (`omo-write-guard`, `omo-context-injector`, `omo-session-notify`, `omo-stop-continuation`).
- `~\.gemini\config\mcp_config.json`: remove our 5 keys (`context7`, `grep_app`, `lsp`, `websearch`, `omo-git-bash` — or their `omo-<key>` conflict copies).

**3. Or restore from backup** — the installer saved pre-install copies as `*.omo-backup-<timestamp>.json` next to the originals; replacing the current files with those restores your previous state, then delete the skill/agent/rule/handler files as in step 1.

## Not ported

See [NOT-PORTED.md](./NOT-PORTED.md) — the exhaustive backlog: all 56 upstream hook directories (each with purpose, reason, and future portability) plus non-hook features (TUI, config schema, CLI installer, model variants, bin entrypoints, postinstall bootstrap, team-mode mailbox, session/compaction/monitor, workspace packages).

## Maintenance

This is an **independent port**: OMO updates are **not** auto-synced. To re-port a newer OMO version, apply the `MAPPING.md` conversion rules manually — no automation is provided.

## License

Distributed under the upstream **Sustainable Use License (SUL-1.0)** — free of charge, non-commercial use. See [LICENSE](./LICENSE). Attribution: derived from [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) by YeonGyu-Kim.

**Q4 disclosure:** only structure validation was performed (`validate.mjs` green); there was no live Antigravity run. First real use should be user-verified against a real Antigravity installation.