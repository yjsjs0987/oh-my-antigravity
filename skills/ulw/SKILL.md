---
name: ulw
description: "Ultrawork (ulw) entry point and router. Trigger on the bare keyword 'ulw' or the /ulw slash command. Routes to the workflow family: a plan before implementation goes to ulw-plan; running a written .omo/plans work plan goes to ulw-execute; research or a deep investigation goes to ulw-research; when ambiguous, ask the user which of the three they want."
---

# ulw — ultrawork router

`ulw` (ultrawork) is the entry keyword of the OMO workflow family. This skill only routes — it never plans, executes, or researches on its own.

## Routing table

| The user wants | Route to |
| --- | --- |
| A plan before implementation ("ulw", "ulw plan", 계획 먼저) | Follow the **ulw-plan** skill (globally installed) |
| To run a written `.omo/plans` work plan ("ulw-execute", plan 실행) | Follow the **ulw-execute** skill |
| Research or a deep investigation ("ulw research", 심층 조사) | Follow the **ulw-research** skill |
| Just "ulw" with no clear intent | Ask the user: plan, execute, or research? |

## Rules

- Once routed, the destination skill's own instructions win — follow them exactly; do not restate or override them here.
- Never pick a destination silently when the intent is ambiguous; ask first.
