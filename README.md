# OMO for Antigravity

**English** | [한국어](README_ko.md)

> **NOTICE — Derivative work.** This repository is a port of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v5.1.40 (© YeonGyu-Kim). Skill and agent content is largely copied from the upstream project and modified for Google Antigravity. It is distributed free of charge for non-commercial use under the upstream **Sustainable Use License (SUL-1.0)** — see [LICENSE](./LICENSE) for the full terms. This is a source-available license, not an OSI open-source license.

**Use your OMO (oh-my-openagent) workflows inside Google Antigravity.** The same 32 skills, 11 subagents, curated MCP servers, and safety hooks you had in OpenCode — installed as native Antigravity global customizations with a double-click installer. Your `/slash-command` muscle memory, delegation habits, and read-before-overwrite guardrails all carry over.

Built for: OMO users switching to Antigravity. The OpenCode-side OMO package is **never modified** — both can run side by side during the transition.

## Highlights

| | |
| --- | --- |
| **32 skills** | dev (10) · research/visual (5) · ulw workflow (4) · team (5) · maintenance (8) — every skill is also a `/<name>` slash command |
| **11 subagents** | sisyphus (orchestration lead, mainAgent), hephaestus, sisyphus-junior, oracle, librarian, explore, metis, momus, atlas, multimodal-looker, prometheus |
| **5 MCP servers** | context7 (library docs), grep_app (real-world code search), websearch, lsp (diagnostics/rename/symbols), omo-git-bash |
| **9 hooks** | omo-write-guard (read before overwrite), omo-keyword-detector (`ulw`/hyperplan/team keyword protocols), omo-task-reminder (pending-work reminder), omo-ast-grep-provision (tooling check), omo-readme-injector + omo-agents-md-injector (project orientation), omo-context-injector (session orientation), omo-session-notify (beep), omo-stop-continuation (keeps the agent going until the plan is done) |
| **Tooling** | one-click launchers + install / uninstall / doctor / validate — zero npm dependencies |

## Porting status

**10 of 56** upstream OMO hooks are ported as native Antigravity handlers — everything the current hook contract allows. The remaining 46 are documented with reasons in [NOT-PORTED.md](./NOT-PORTED.md): 24 wait on contract gaps (e.g. PostToolUse output semantics are undefined), 22 are bound to OpenCode runtime internals (session/compaction/TUI). The skill/agent/MCP layer is fully ported.

## Install — step by step

### Step 0 — Prerequisites

- **Node.js 20 or newer** — the installer and hook handlers run on it. Download the LTS installer from [nodejs.org](https://nodejs.org), run it, then check in any terminal:
  ```powershell
  node --version
  ```
- **Google Antigravity** — the desktop App or IDE, installed and signed in.

### Step 1 — Get this repository

Either way works; the folder can live anywhere (for example `C:\Users\<you>\oh-my-antigravity`). **Keep the folder after installing** — it doubles as the uninstall source.

**Option A — with git:**
```powershell
git clone https://github.com/yjsjs0987/oh-my-antigravity.git
cd oh-my-antigravity
```

**Option B — without git:**
1. On this GitHub page, click the green **Code** button → **Download ZIP**.
2. Right-click the downloaded `oh-my-antigravity-main.zip` → **Extract All…** → open the extracted folder.

### Step 2 — Run the installer

Double-click **`install.cmd`** in that folder. (Windows SmartScreen may warn on first run of a downloaded file — click **More info → Run anyway**.) Terminal equivalent:

```powershell
node scripts\install.mjs
```

What happens: 32 skills, 11 agents, 1 rule, and 9 hook handlers are copied into `~\.gemini\config\`, and the MCP/hook registrations are merged into your config JSONs. Your existing `mcp_config.json` / `hooks.json` are **backed up first** as `*.omo-backup-<timestamp>.json` — only our keys are added, everything else is untouched. The installer is idempotent (safe to re-run).

Advanced flags (optional, terminal only):

- `--home <dir>` — install into a custom home (used for testing).
- `--cli` — additionally copy skills into `~\.gemini\antigravity-cli\skills\` for the Antigravity CLI.
- `--dry-run` — print the install plan (file counts, merge keys) without writing anything.
- `--no-validate` — skip the automatic structure validation at the end.

### Step 3 — Restart Antigravity

Fully quit Antigravity (check the system tray for a background icon) and reopen it, so the global config under `~\.gemini\config\` is re-read.

### Step 4 — Verify

1. Double-click **`doctor.cmd`** — every line should read `[PASS]` (warnings are okay) and finish with **"Integration looks healthy."**
2. In an Antigravity chat, type `/git-master` (or any skill name) — the skill should load. Type `ulw` — the router should ask you **plan / execute / research**.
3. Delegate to a ported subagent by name if you use delegation.

That's it — see [Uninstall](#uninstall) for removal and [NOT-PORTED.md](./NOT-PORTED.md) for what was intentionally left out.

## Usage

Nothing to configure — after install, everything below is available in every Antigravity chat, in every workspace. This section is written for first-time users.

### Skills — call with `/` or just ask

Every skill is a `/<name>` slash command, and each one also triggers **automatically** when your request matches its description. So `/git-master` is explicit, but simply saying "commit these changes" works too.

Copy-paste starters:

```text
/git-master commit these changes with a conventional message
/debugging the app crashes on startup — stack trace: <paste it>
/refactor split this 600-line file into focused modules
have oracle review my API design before I build it
/data-scientist analyze sales.csv and show monthly revenue trends
```

### The 32 skills — what to use when

**Development**

| Skill | Use it when |
| --- | --- |
| `ast-grep` | you need to find/rewrite code by syntax shape across many files |
| `debugging` | something crashes, fails silently, or behaves weirdly |
| `frontend` | you're building or polishing HTML/CSS/SVG interfaces |
| `git-master` | any git work: commits, rebase, squash, bisect, blame |
| `init-deep` | you want an AGENTS.md knowledge base generated for a repo |
| `lsp-setup` | "go-to-definition doesn't work" — wire up a language server |
| `programming` | writing Python/Rust/TypeScript/Go the strict, modern way |
| `refactor` | restructuring or simplifying code safely |
| `remove-ai-slops` | cleaning up AI-generated code smells with regression tests |
| `review-work` | gate review before handing work off |

**Research & visual**

| Skill | Use it when |
| --- | --- |
| `browser` | a real browser is needed: forms, clicks, JS-rendered pages, screenshots |
| `coding-agent-sessions` | finding what a past coding-agent session did |
| `data-scientist` | CSV/parquet/JSON analysis and charts |
| `ultimate-browsing` | pages that block bots or need archive snapshots |
| `visual-qa` | checking that a UI actually LOOKS right (light/dark, mobile/desktop) |

**ulw workflow** — see the loop below

| Skill | Use it when |
| --- | --- |
| `ulw` | the entry keyword — routes to plan / execute / research |
| `ulw-plan` | you want a reviewed, step-by-step plan BEFORE any code |
| `ulw-execute` | you have a plan in `.omo/plans` and want it implemented |
| `ulw-research` | deep investigation with a cited, QA'd deliverable |

**Team-driven**

| Skill | Use it when |
| --- | --- |
| `github-triage` | triaging a pile of GitHub issues/PRs read-only |
| `hyperplan` | you want 5 adversarial roles attacking a plan from all sides |
| `pre-publish-review` | nuclear-grade gate before a release |
| `work-with-pr` | full PR lifecycle: implement → review → merge |
| `security-research` | vulnerability hunt with exploit proof-of-concepts |

**Maintenance**

| Skill | Use it when |
| --- | --- |
| `codex-qa` / `opencode-qa` / `senpi-qa` | QA of the OMO sibling adapters themselves |
| `get-unpublished-changes` | what changed since the last npm release |
| `omomomo` | easter egg — try it |
| `publish` | the npm publish workflow |
| `remove-deadcode` | deleting unused code with LSP-verified safety |
| `tech-debt-audit` | a file-cited tech debt report across 9 dimensions |

### Subagents — the specialist bench

The 11 custom subagents are the workers your main agent (or any workflow skill) delegates to. You never call them by hand — just say **who should do what**:

```text
have oracle review this architecture decision
fire explore agents to find every place we parse CSV
ask librarian for the official Playwright docs on tracing
```

Notable assignments: oracle, metis and momus are the judgment bench (they follow whatever top model you select — e.g. Gemini 4 Argon); sisyphus is the orchestration lead and can be selected as the main agent in the agent picker; prometheus is the planner persona behind the ulw skills.

### MCP servers — automatic superpowers

No action needed. Once installed, the agent can pull **official library docs** (context7), **real-world code examples** (grep.app), **web search** (exa), and **code intelligence** (lsp: diagnostics, go-to-definition, rename, symbols) whenever a task needs them.

### Hooks — automatic guardrails

Also no action needed. The ones you'll notice:

- **write-guard** — refuses to overwrite a file nobody has read in this conversation ("Read the file before overwriting").
- **keyword-detector** — typing `ulw`, `hyperplan` or `team mode` in a message activates the matching workflow protocol.
- **stop-continuation** — at session stop, if the active `.omo/plans` file still has unchecked boxes, the agent continues instead of quitting.
- **session-notify** — a beep when a session starts/finishes. The rest (context/task/tooling injectors) quietly orient the agent.

### The ulw loop — the OMO way of working

The signature workflow: **plan first, then execute, never half-deliver.**

1. Type `ulw` (or describe the task and ask for a plan). The **ulw-plan** skill interviews you, explores the codebase, then writes a decision-complete plan to `.omo/plans/<name>.md` and asks for your approval.
2. Say **"ulw-execute"** (or just approve). The **ulw-execute** skill runs the plan wave by wave with parallel subagents — every step lands with evidence, and the stop hook keeps the agent going until every checkbox in the plan is `[x]`.
3. Need research first? `ulw-research` produces a cited, QA'd report before any planning.

The plan file is plain markdown in your workspace — read it, edit it, or throw it away. That's the whole magic.

## What gets installed (and where)

| Artifact | Path (under your user home) |
| --- | --- |
| 32 skills | `~\.gemini\config\skills\<name>\SKILL.md` |
| 11 agents | `~\.gemini\config\agents\<name>.md` |
| 1 rule | `~\.gemini\config\rules\omo-port.md` |
| 9 hook handlers | `~\.gemini\config\omo-handlers\*.mjs` |
| 5 MCP registrations | merged into `~\.gemini\config\mcp_config.json` |
| 9 hook registrations | merged into `~\.gemini\config\hooks.json` |

Existing `mcp_config.json` / `hooks.json` are **backed up as `*.omo-backup-<timestamp>.json` before merging** — only our keys are added, everything else is left untouched. Conflicting keys of yours are preserved; ours are saved under an `omo-<key>` name instead.

## Validate

One-click: **`validate.cmd`**. Terminal:

```powershell
node scripts\validate.mjs
```

Zero dependencies. Exits 0 when all suites pass (skills, agents, MCP, hooks, rules, NOT-PORTED row count) and prints a summary table; exits 1 with a violation list otherwise. The installer runs this automatically at the end unless `--no-validate` is passed.

## Doctor

When something feels off, run automatic diagnostics against the **installed** state. One-click: **`doctor.cmd`**. Terminal:

```powershell
node scripts\doctor.mjs
```

Checks: config dir, all 32 skills / 11 agents / rule present, all 9 handlers parse (`node --check`), our MCP keys registered + entry files exist (warns if the OMO package was removed), all 9 `omo-*` hook keys registered, and a live smoke test of the installed write-guard. `[FAIL]` lines exit 1 with a reinstall hint; warnings exit 0. Flags: `--repo` also runs the full structure validator, `--home <dir>` targets a custom home.

## Uninstall

One-click: **`uninstall.cmd`**. Terminal (from the repo root):

```powershell
node scripts\uninstall.mjs          # add --dry-run to preview
```

It removes **only our artifacts** — the 32 skill dirs, 11 agents, the rule, `omo-handlers\`, our `omo-*` keys in `hooks.json`, and our 5 keys (or their `omo-<key>` conflict copies) in `mcp_config.json` — after backing both JSONs up as `*.omo-backup-<timestamp>.json`. Everything else in your config is untouched, and `*.omo-backup-*.json` files are kept.

Manual fallback (if the repo is gone): delete `~\.gemini\config\skills\<our 32 skill dirs>`, `agents\<our 11 .md files>`, `rules\omo-port.md`, `omo-handlers\`; remove the 9 `omo-*` keys from `hooks.json` and our 5 MCP keys from `mcp_config.json` — or restore both from a `*.omo-backup-<timestamp>.json` backup.

## Not ported

See [NOT-PORTED.md](./NOT-PORTED.md) — the exhaustive backlog: all 56 upstream hook directories (each with purpose, reason, and future portability) plus non-hook features (TUI, config schema, CLI installer, model variants, bin entrypoints, postinstall bootstrap, team-mode mailbox, session/compaction/monitor, workspace packages).

## Maintenance

This is an **independent port**: OMO updates are **not** auto-synced. To re-port a newer OMO version, apply the `MAPPING.md` conversion rules manually — no automation is provided.

## License

Distributed under the upstream **Sustainable Use License (SUL-1.0)** — free of charge, non-commercial use. See [LICENSE](./LICENSE). Attribution: derived from [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) by YeonGyu-Kim.

**Q4 disclosure:** only structure validation was performed (`validate.mjs` green); there was no live Antigravity run. First real use should be user-verified against a real Antigravity installation.