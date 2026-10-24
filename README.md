# OMO for Antigravity

> **NOTICE — Derivative work.** This repository is a port of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v5.1.40 (© YeonGyu-Kim). Skill and agent content is largely copied from the upstream project and modified for Google Antigravity. It is distributed free of charge for non-commercial use under the upstream **Sustainable Use License (SUL-1.0)** — see [LICENSE](./LICENSE) for the full terms. This is a source-available license, not an OSI open-source license.

Port of OMO (OpenCode extension pack, v5.1.40) skills, agents, MCP servers, and hooks into Antigravity global config format.

## Table of Contents

- [Overview](#overview)
- [What's included](#whats-included)
- [Install](#install)
- [Validate](#validate)
- [Uninstall](#uninstall)
- [Not ported](#not-ported)
- [Maintenance](#maintenance)

## Overview

This repo is a one-way port of OMO v5.1.40 into Antigravity's global config format. It installs into `~/.gemini/config/` (skills, agents, rules, MCP registrations, hooks) plus an optional Antigravity CLI skills copy, and ships `scripts/install.mjs` and `scripts/validate.mjs` for setup and structure validation.

What this port does **NOT** touch:

- **OpenCode OMO** — the source package at `<OMO>` is read-only; nothing there is modified.
- **Antigravity itself** — no Antigravity files are edited; only your `~/.gemini/config/` user config is written.
- **No live Antigravity run** — validation is structure-only (Q4); the first real use should be user-verified.

## What's included

| Category | Count | What |
| --- | --- | --- |
| Skills | 31 | `skills/*/SKILL.md` — dev (10), research-visual (5), workflow (3), team (5), maintenance (8). See `rules/omo-port.md` for the category list. |
| Agents | 11 | `agents/*.md` — sisyphus, hephaestus, sisyphus-junior, oracle, librarian, explore, metis, momus, atlas, multimodal-looker, prometheus. |
| MCP registrations | 5 | `mcp/mcp-config.fragment.json` — context7, grep_app, lsp, websearch, omo-git-bash. |
| Hooks + handlers | 4 | `hooks/hooks.fragment.json` + `hooks/handlers/*.mjs` — omo-write-guard, omo-context-injector, omo-session-notify, omo-stop-continuation. |
| Rules | 1 | `rules/omo-port.md` — `trigger: model_decision` rule preferring the ported skill set. |
| Scripts | 2 | `scripts/install.mjs` (backup-merge installer, `--home`/`--cli`/`--dry-run`/`--no-validate`), `scripts/validate.mjs` (structure validation, exit 0 = green). |
| Docs | 2 | `MAPPING.md` (opencode→Antigravity conversion rules + FORBIDDEN tokens), `NOT-PORTED.md` (exhaustive backlog of what was intentionally left out). |

## Install

```powershell
node scripts/install.mjs
```

Installs to `~/.gemini/config/` (on win32, `~` = your user profile). Existing `mcp_config.json` and `hooks.json` are **backed up as `*.omo-backup-<timestamp>.json` before merging**, and only our keys are added/merged — every other key is left untouched.

Flags:

- `--home <dir>` — install into a custom home (used for testing).
- `--cli` — additionally copy skills into `~/.gemini/antigravity-cli/skills/` for the Antigravity CLI copy.
- `--dry-run` — print the install plan (file counts, merge keys) without writing anything.
- `--no-validate` — skip the automatic `scripts/validate.mjs` run at the end.

The installer is idempotent: re-running produces the same tree.

## Validate

```powershell
node scripts/validate.mjs
```

Zero dependencies. Exits 0 when all suites pass (skills, agents, MCP, hooks, rules, NOT-PORTED.md row count) and prints a summary table; exits 1 with a violation list otherwise. The installer runs this automatically at the end unless `--no-validate` is passed.

## Uninstall (manual procedure)

There is no uninstall script — remove the ported artifacts manually:

1. Delete our 31 skill directories under `~/.gemini/config/skills/`:
   ast-grep, browser, codex-qa, coding-agent-sessions, data-scientist, debugging, frontend, get-unpublished-changes, git-master, github-triage, hyperplan, init-deep, lsp-setup, omomomo, opencode-qa, pre-publish-review, programming, publish, refactor, remove-ai-slops, remove-deadcode, review-work, security-research, senpi-qa, tech-debt-audit, ultimate-browsing, ulw-execute, ulw-plan, ulw-research, visual-qa, work-with-pr
   (same names as the repo's `skills/` directory).
2. Delete our 11 agent files under `~/.gemini/config/agents/` (same names as repo `agents/`).
3. Delete `~/.gemini/config/rules/omo-port.md`.
4. Delete `~/.gemini/config/omo-handlers/` (our 4 handler `.mjs` files).
5. Remove the 4 `omo-*` keys from `hooks.json`.
6. Remove our 5 MCP keys (`context7`, `grep_app`, `lsp`, `websearch`, `omo-git-bash` — or their `omo-<key>` conflict copies) from `mcp_config.json`, or restore `mcp_config.json`/`hooks.json` from a `*.omo-backup-<timestamp>.json` backup made by the installer.

## Not ported

See [NOT-PORTED.md](./NOT-PORTED.md) — the exhaustive backlog: all 56 hook directories plus non-hook features (TUI, config schema, CLI installer, model transformation, 5 bin entrypoints, postinstall bootstrap, team-mode mailbox, session/compaction/monitor, 40 workspace packages), each with name, purpose, reason not ported, and future portability.

## Maintenance

This is an **independent port**: OMO updates are **not** auto-synced. To re-port a newer OMO version, apply the `MAPPING.md` conversion rules manually — no automation is provided.

**Q4 disclosure:** only structure validation was performed (`validate.mjs` green); there was no live Antigravity run. First real use should be user-verified against a real Antigravity installation.
