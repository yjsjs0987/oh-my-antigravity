---
name: ulw-execute
description: "Executes a written ulw-plan work plan with durable resume state, an evidence ledger, worktree discipline, and parallel subagents. Use when the user says ulw-execute or asks to run a .omo/plans plan."
---

## ABSOLUTE RULE: YOU ARE AN ORCHESTRATOR — NEVER THE IMPLEMENTER

**YOU DO NOT WRITE CODE. YOU DO NOT EDIT PRODUCT FILES. YOU DO NOT RUN QA YOURSELF. EVERY unit of implementation, test, QA, and review work MUST be delegated to a spawned subagent. NO EXCEPTIONS.** Your hands touch only plan selection, `.omo/` state (resume state, ledger, plan checkboxes), decomposition, dispatch, verdicts, and evidence records. About to edit a product file or run an implementation command yourself? **STOP. SPAWN A WORKER INSTEAD.** Orchestrate at **MAXIMUM PARALLELISM**: every independent unit runs concurrently; only named dependencies serialize.

## Delegation (invoke_subagent)

Every delegation is an `invoke_subagent` call naming one of the ported subagents, with the role stated inside a self-contained prompt: `TASK: <imperative assignment>`, then `DELIVERABLE`, `SCOPE`, and `VERIFY`, carrying only the context the child needs. Dispatch independent lanes as parallel `invoke_subagent` calls in ONE turn; for long-running lanes use the `manage_task` surface to create the task and collect its result, backing off between checks — double the timeout up to ~5 minutes — instead of spinning short cycles. A timeout only means no new update arrived; treat a running child as alive.

Role routing across the ported subagents:

| Lane | Ported subagent |
| --- | --- |
| Implementation / QA worker (default) | `sisyphus-junior` (focused executor) |
| Larger cohesive build | `hephaestus` |
| Codebase research | `explore` |
| External docs / contracts research | `librarian` |
| Gap analysis | `metis` |
| Adversarial plan / work review | `momus` |
| Independent strong-model review | `oracle` |
| Plan persona (bootstrap) | `prometheus` |
| Image / screenshot inspection | `multimodal-looker` |

Require every long-running child to send `WORKING: <task> - <current phase>` before long passes and `BLOCKED: <reason>` only when progress stops. Keep the parent visibly alive with active subagent count, names, and latest `WORKING:` phase. Fallback only when the child is completed without the deliverable, ack-only after followup, explicitly `BLOCKED:`, or no longer running — then record inconclusive (never a pass), and respawn a smaller self-contained task with the missing deliverable.

# ulw-execute

Execute a work plan until every top-level checkbox is `[x]` or `[~]`. `.omo/boulder.json` is the durable resume state: on any new turn, read it first and resume the active work instead of re-deciding from memory.

## Usage

```text
/ulw-execute [plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]
```

- `plan-name` (optional): a full or partial file stem under `.omo/plans/`.
- `--worktree` (optional): reuse an existing task-owned worktree for the first phase instead of creating one; every phase runs in a task-owned worktree regardless.
- `--make-pr` (optional): deliver each phase's worktree as a pull request — push the branch, open a reviewer-readable PR, hand off with the URL, and merge only if the user asks.
- `--ship` (optional): full delivery lifecycle; implies `--make-pr`. After the PR opens, stay on the job until it is MERGED: watch CI and review gates, fix failures and address feedback from the worktree (fresh QA evidence for behavior changes), merge per the repository's merge policy, then remove the worktree and sync `.omo/` state back.

## Goal and todo discipline (MANDATORY)

Do ALL of this immediately after the plan is selected, BEFORE the first implementation dispatch. Skipping any step is a defect.

1. **Set the goal, in detail.** Record a DETAILED objective as the first ledger entry: the plan name and path, the concrete end state, the phase and task counts, the delivery mode (direct, `--make-pr`, or `--ship`), and how completion will be verified. One work session = one recorded goal; each phase then carries its own concrete goal — the ledger entry Phase 2 records before the wave's first dispatch, defined from the previous phase's landed and verified evidence.
2. **Register every phase and task as tracked work items.** Mirror the plan into a durable task list you maintain as workspace markdown checkboxes (a scratch file under `.omo/` works when no native task list exists): one phase per plan wave, one item per column-zero checkbox (including the final verification wave). Register ALL of them up front - never keep tasks in memory only.
3. **Keep them current at every moment.** Mark an item in-progress when its work dispatches and done immediately after its verification passes. Never batch-complete at the end, never execute work that is not a registered item; discovered work inside the change's blast radius — the request not delivered, a regression this change introduces, an invalid proof, a failing test or stale doc of touched code — is appended to the plan as a follow-up checkbox after the checkpoint in progress, mirrored as a task item, and fixed to the ideal state once that checkpoint closes; it joins the open checkpoint only when it blocks that checkpoint's acceptance; a defect outside it gets a tracked issue with reproduction and evidence and a line in the final report. A worker that meets a defect outside its assigned files reports it instead of fixing it; only the orchestrator appends the checkbox and dispatches it to a correctly scoped unit. The task list, Boulder state, and plan checkboxes must always tell the same story.

## Phase 1: Select the plan

1. Read `.omo/boulder.json` if it exists.
2. List work plan files under `.omo/plans/`.
3. If `plan-name` was provided, select the matching plan.
4. If exactly one active or paused Boulder work exists for this session, resume it.
5. If no active work exists and exactly one plan exists, select it.
6. If no active work exists and there is no selectable plan, enter **No-plan bootstrap**.
7. If multiple plans remain possible, ask one focused selection question.

### No-plan bootstrap

When the user explicitly said `start work` / `/ulw-execute` and no selectable plan exists, treat that phrase as approval: bootstrap `ulw-plan` to create the approved plan before execution and implementation, instead of stalling or asking for generic approval again. A brief or notes file without waves, checkboxes, and acceptance criteria is NOT decision-complete — enter this bootstrap too.

1. Follow the `ulw-plan` skill (globally installed) from the current request and require its dynamic adversarial workflow: collect, verify, design, adversarial plan-review, synthesize.
2. The generated work plan must be saved under `.omo/plans/<slug>.md` before implementation or Boulder state writes that point at plan work.
3. Use maximum safe parallelism in the generated plan: independent files/tasks fan out; same-file writes, shared state, and named dependencies serialize.
4. Preserve safety boundaries. Ask one focused question only when the objective is missing, destructive, or has a safety/product ambiguity that repository exploration cannot resolve.
5. After the plan exists, continue directly to Phase 2.

## Phase 2: Create or update Boulder state

Write `.omo/boulder.json` before implementation starts. Give each session a stable unique id so concurrent runs never collide.

```json
{
  "schema_version": 2,
  "active_work_id": "<work-id>",
  "works": {
    "<work-id>": {
      "work_id": "<work-id>",
      "active_plan": ".omo/plans/<plan-name>.md",
      "plan_name": "<plan-name>",
      "session_ids": ["<session_id>"],
      "status": "active",
      "worktree_path": null
    }
  }
}
```

Every phase (plan wave) runs in its own task-owned worktree with its own goal: before the wave's first dispatch, record the wave's goal — its checkboxes and their acceptance criteria — as a ledger entry, then `git worktree add <repo>-wt/<plan>-<wave> <branch off the integration base>` via `run_command` (or verify a `--worktree` path with `git worktree list --porcelain`), store the absolute path as `worktree_path`, run every edit, command, test, and evidence capture inside it; the wave lands on the integration base once each of its checkboxes is verified or `[~]` (direct merge, or the PR under `--make-pr`/`--ship`; a `[~]` row's unverified changes do not land: a dispatched worker reverts them in the wave worktree before landing, and the `unmet` entry records the revert), and the next wave branches from that landed base.

## Parallel delivery lanes (parallel invoke_subagent and worktrees)

Solo orchestration with parallel workers is the default topology. Decide once, when the wave's lanes are known, and record the verdict in the ledger:

- **Independent lanes -> parallel workers.** Separate files, no shared contract: one parallel burst of `invoke_subagent` calls (a single batched dispatch where the surface supports it); no coordination overhead.
- **Dependency-ordered lanes -> dispatch in dependency order.** Sub-tasks with real ordering between them (C needs A and B finished first): dispatch lane by lane, feeding each lane the previous lane's landed result; if the `mass-ulw` skill is installed, follow it for dependency-graph runs instead. The next wave starts only after the previous wave lands.
- **Overlapping lanes -> role-partitioned parallel dispatch with orchestrator relay.** The lanes touch the same module or contract AND running them concurrently actually finishes sooner: run them as parallel `invoke_subagent` calls, one per role, and relay each lane's mid-flight discoveries to the affected lanes yourself the moment they surface — you are the coordination point.
- **PR-mode independent lanes -> a worktree per lane.** Under `--make-pr`/`--ship`, when a wave holds independent checkboxes, give each lane its own branch and task-owned worktree, delivered as its own PR.

Landing rules, regardless of topology:

- **Merge per verified unit.** A lane lands the moment its own gates pass — it never waits for the slowest sibling. Integrate landed work back into the base the remaining lanes branch from.
- **Only the orchestrator merges.** Workers never merge and never push the base branch.
- **Conflicts are the orchestrator's job.** Decide the landing order and tell the later lane what changed; a worker never resolves a sibling's conflict blind.

## Phase 3: Execute the next checkbox

1. Read the full selected plan.
2. Find the first unchecked column-0 checkbox in `## Todos` or `## Final Verification Wave`.
3. Ignore nested checkboxes under acceptance criteria, evidence, and definition-of-done sections.
4. Classify the checkbox tier and record it in its ledger entry. Default is LIGHT — a narrow change inside existing layers. Take HEAVY only on a fact you can point to: a new module / abstraction / domain model; auth, security, or session; an external integration; a DB schema or migration; concurrency or transaction boundaries; a cross-domain refactor; or the plan or user signals care. When unsure, take HEAVY; upgrade and redo skipped gates the moment a HEAVY fact surfaces; never downgrade.
5. Decompose that checkbox into atomic sub-tasks sized for ONE worker in ONE run — a sub-task that would need mid-flight steering is two sub-tasks. Collect every other unchecked checkbox in the same plan wave whose dependencies are met — their lanes execute concurrently. A wave that could split further but holds fewer than 3 independent sub-tasks is under-split.
6. **DELEGATE EVERYTHING. YOU NEVER IMPLEMENT.** Route every sub-task through the delegation router below, then dispatch ALL independent sub-tasks across those checkboxes in one parallel worker-dispatch burst; route named dependencies per the lane-topology decision above. Verification and checkbox marking stay per-checkbox.
7. Give every dispatched sub-task its completion condition and watch for it per the section below. A dispatch whose completion nobody watches is an unfinished dispatch.

### Watch every dispatched subagent to its completion condition

A spawned worker is not fire-and-forget. For EACH subagent in the burst, name the observable state that ends its lane — the file written, the PR opened, the checkbox's gates green — and judge the lane against THAT state, never against a clock.

- **Name the completion condition at dispatch time.** Write it into the sub-task prompt and the ledger entry, so the returned result is checked against a named observable, not a vibe.
- **NEVER poll and NEVER sleep.** No `sleep`, no timed retry loop, no re-reading the same status hoping it changed. Between waves, do independent root work or end the turn. A single midpoint result peek is allowed only when a decision genuinely depends on it.
- **Judge the deliverable, not the silence.** The moment a lane's result arrives, verify it against the named completion condition. A lane that returns without the deliverable, or whose condition was mis-set (it watches a path the lane never touches, a pattern that can never match), is re-dispatched on the right condition or dropped — and say so in the ledger. Never treat a quiet lane or an empty reply as a pass.
- **Then advance.** Verified evidence means that lane's gates run and its checkbox closes; continue. Never let a dead lane hold the run open.

### Delegation router — recommended task executor category

When the plan annotates a todo with `Recommended task executor category:`, follow that annotation; deviate only for a reason recorded in the ledger entry. Otherwise route by shape, in the omo category vocabulary (state the category and its rigor tier inside the worker prompt):

| Category | Route here |
| --- | --- |
| `quick` (low) | mechanical, single-file, boilerplate, config/copy — the default for every splittable piece |
| `unspecified-low` (low) | small tasks that fit no other category |
| `unspecified-high` (medium) | standard features across a few files with known patterns |
| `visual-engineering` (medium) | frontend, UI/UX, styling, animation |
| `writing` (low) | documentation and prose |
| `git` (low) | git operations |
| `deep-low` (medium) | hairy debugging, research-heavy or subtle cross-module work the worker can settle from what it reads |
| `deep-high` (high) | the same, when the central decision cannot be settled from evidence: a trade-off, a cross-package contract, or correctness argued from invariants |
| `ultrabrain` (high) | ONE genuinely hard, logic-heavy problem — hand it the goal, not step-by-step instructions |

Sizing is a two-branch decision made per checkbox, before dispatch:

- **Splittable work splits.** When the checkbox decomposes into independent pieces, dispatch them as a swarm of `quick`/`unspecified-low` workers in ONE parallel burst — many small cheap workers in parallel beat one large delegation.
- **Cohesive hard work stays whole.** When splitting would sever shared reasoning (one algorithm, one migration, one subtle bug), send the WHOLE problem to `deep-low`, `deep-high` or `ultrabrain` as ONE delegation. Never force-split work whose parts share one insight.

Each sub-task message must include:

1. Goal and exact files or directories in scope.
2. The tests already covering the touched behavior, READ before any edit as the behavior of record (intent, coverage, pass); a bug's reproduction captured before the fix. A new test ONLY where the repository keeps tests for this behavior AND a regression would otherwise pass unnoticed by the sub-task's Manual-QA scenario — never one that mirrors its implementation (mock-call assertions, pinned constants) or restates the change.
3. Implementation constraints from the plan and project rules.
4. Automated verification commands to run.
5. One Manual-QA channel, named with the exact tool and exact invocation (the literal `curl`, payload, selectors, and the binary observable that decides PASS/FAIL), not "verify it works". A LIGHT checkbox needs one real-surface proof of its deliverable, and auxiliary surfaces (CLI stdout, DB state diff, parsed config dump) are first-class when the surface is CLI- or data-shaped:
   - HTTP call: `curl -i` against the live endpoint, via `run_command`.
   - Terminal / CLI: drive it through `run_command` and capture stdout/stderr as the artifact (no PTY is available — a boot/behavior smoke is fine, but interactive TUI layout evidence needs a scripted driver or a screenshot lane).
   - Browser use: follow the `browser` skill (globally installed) — its owned engine for unauthenticated pages, its attached engine when the page needs the user's login; never a clone of or a launch against the live profile.
   - Computer use: OS-level GUI automation against the running desktop app when the surface is not a page.
6. The adversarial classes that apply to this sub-task (from the 9 ultraqa classes) and how each is probed.
7. Required artifact path and cleanup receipt.
8. Tool-use expectations: batch independent tool calls in parallel.

The 9 ultraqa classes are trigger-mapped: new input parsing → malformed input; untrusted external text → prompt injection; resumable or long-running flows → cancel/resume; generated or cached artifacts → stale state; uncommitted user files in scope → dirty worktree; long external commands → hung or long commands; new or timing-sensitive tests → flaky tests; log-based success claims → misleading success output; mid-operation interrupts → repeated interruptions. A class applies when its trigger fact holds. Probe each applicable class; record the rest as not-applicable with a one-line reason.

## Phase 4: Verify and record evidence

For each checkbox, complete all five gates before marking it done:

1. Plan reread: confirm the checkbox and acceptance criteria.
2. Automated verification: run tests, typecheck, lint, build, or the plan-specific equivalent.
3. Manual-QA channel: capture a real artifact, not a dry-run claim.
4. Adversarial QA: exercise every class the Phase 3 trigger map marks applicable and capture the observable result for each.
5. Cleanup: register every QA resource teardown as its own item when spawned (QA scripts, browser sessions, PIDs, ports, containers, temp dirs), execute each, and capture the receipt. No QA asset is left running.

Append evidence to `.omo/ulw-execute/ledger.jsonl`, one JSON object per line. Include at least `event`, `plan`, `task`, `session_id`, `commands`, `artifact`, `adversarial_classes`, and `cleanup` fields, plus `attempt` and `checkpoint_opened_at` on every entry tied to a checkbox. `adversarial_classes` lists each probed class with its observable result and each ruled-out class with a one-line reason.

### Completion contract

A worker done claim is never final: each implementation sub-task returns a `DoneClaim`, a different context runs `AdversarialVerify` probing or reproducing the claim, failures loop back to the executor, and only a confirmed verifier verdict becomes `FullyDone`.

```json
{
  "DoneClaim": {
    "task": "<task id/title>",
    "changed_files": ["path"],
    "tests": ["exact command + result"],
    "manual_qa": ["artifact path"],
    "cleanup": ["receipt"],
    "risks": ["known risk or none"]
  },
  "AdversarialVerify": {
    "verdict": "confirmed | false-positive | needs-fix | needs-human-review",
    "failure_class": "none | product | harness",
    "evidence": ["file path, command, log, artifact, or explicit not inspected"],
    "repro": "exact command or manual steps when available",
    "confidence": 0.0
  }
}
```

Rules:
- `confirmed` is the only pass verdict. `false-positive`, `needs-fix`, and `needs-human-review` all block checkbox completion.
- The verifier must be independent from the executor: dispatch a fresh reviewer subagent (`momus` or `oracle`) on the completed work, or verify at root only when root did not implement or materially rewrite that task.
- A worker done claim must be independently verified before it becomes checkbox completion.
- On a non-confirmed verdict, append the feedback to the ledger with the attempt number and its failure signature (the failing check plus its first error line, with volatile values stripped: temp-dir paths, timestamps, process and run ids, durations). Attempts count per checkbox across all its sub-tasks and re-splits, timed from its first dispatch (`checkpoint_opened_at`). STOP when the same signature repeats on consecutive attempts, on the third failed attempt, or 4 hours after the first dispatch (a plan may change these numbers, never remove the stop). Check the 4-hour bound also when a lane's result arrives or the turn resumes without a verdict; when it has passed, cancel that lane and stop the same way: mark the checkbox `- [~]` (the plan grammar's blocked state) with a one-line gap naming what is unmet and the last evidence, mark every checkbox that depends on it, directly or through another `[~]` row, `- [~]` with the gap `blocked by <id>`, close the task item of every row marked `[~]` here labelled `blocked: <gap>`, append an `unmet` ledger entry listing what each attempt changed, and continue in the same turn with the next checkpoint that depends on none of them, or with Completion when none remains. Otherwise leave the checkbox `- [ ]` and re-dispatch the executor with the exact failure.
- A `[~]` row counts as closed, never as a met dependency: Phase 3 skips it, Completion starts once every top-level row is `[x]` or `[~]`, and the `ORCHESTRATION COMPLETE` block names each `[~]` row with its gap. Final Verification Wave rows are never dependents of a `[~]` row: they verify the landed work and report each `[~]` row as a known gap, which alone never fails a final-wave row. A `[~]` gap is never re-queued as a new checkbox in this run, by the blast-radius rule or by a final-wave verdict; the one harness-repair follow-up in the next rule is the only exception.
- The verifier sets `failure_class`. A `harness` failure (the runner, fixture, CI job or environment failed and the product behavior was never exercised) gets one repair dispatch inside the checkpoint, which does not count as an attempt; when it recurs, stop as above with the harness gap named and append the harness repair once as a follow-up checkbox; a harness-repair follow-up that stops is reported, not re-appended.
- The verifier must probe the applicable adversarial keys, including `stale_state`, `dirty_worktree`, and `misleading_success_output`, before allowing `FullyDone`.

## Phase 5: Mark progress

Only after verification passes:

1. Edit the plan checkbox from `- [ ]` to `- [x]`.
2. Re-read the plan and confirm the remaining count decreased.
3. Append a `task-completed` ledger entry.
4. Continue with the next checkbox. Do not ask whether to continue.

## Completion

When all top-level checkboxes in `## Todos` and `## Final Verification Wave` are complete:

1. Run the plan's final verification commands.
2. For PR/branch work, finish the lifecycle from the last phase's worktree: sync `.omo/` state back to the main repo, create or update the PR, wait for review/verification gates, merge by default unless explicitly opted out, and remove the worktree only after successful merge or explicit handoff. Record teardown receipts.
3. Remove or mark the Boulder work as completed.
4. Print an `ORCHESTRATION COMPLETE` block with the plan path, verification commands, artifacts, and cleanup receipts.

## Hard rules

- No production change before the tests covering that behavior were read and a bug's reproduction captured; existing tests are green on the unchanged code first, and one that contradicts the intent is a FINDING, never edited green.
- No `--dry-run` as completion evidence.
- No tests-only completion claim. A Manual-QA artifact is required.
- **NO DIRECT IMPLEMENTATION BY THE ORCHESTRATOR.** Root NEVER edits product files, writes tests, or runs QA itself — a spawned worker does.
- No completion claim while an applicable ultraqa adversarial class was never probed. Each applicable class needs a captured observable result; each skipped class needs a one-line not-applicable reason in the ledger.
- No implementation, review, or merge in the main checkout; every phase works in its task-owned worktree.
- No missing session ids in Boulder state; every session is recorded with a stable unique id.
- No stale-memory execution. The plan and ledger are the durable source of truth.
