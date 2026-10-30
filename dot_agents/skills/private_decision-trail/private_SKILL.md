---
name: decision-trail
description: One TSV of rulings and checkpoints for work that outlives a sitting or that someone reviews later. One row per decision with what, why, evidence, result. Use for /decision-trail, autonomous or multi-phase runs, or "trust it when I'm back".
---

# Decision trail

One canonical log per effort. Append-only. A wrong call gets a new row that supersedes it.

## Format

A TSV with the header in [references/decision-log-template.tsv](references/decision-log-template.tsv): `ts`, `phase`, `decision`, `why`, `evidence`, `result`.

- `decision`: what was chosen or done, one line, plain words.
- `why`: the reason a teammate would accept.
- `evidence`: a pointer, never prose. Commit SHA, PR number, `file:line`, artifact path, delegate `taskId`.
- `result`: `tests green`, `preview pass`, `reverted`, `BLOCKED: <what>`, `open`.

Append with `scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>`. It stamps `ts`, writes the header on first use, and keeps cells single-line.

## What gets a row

A ruling from the user. A fork you chose. A unit completed with its verification result. A pivot or revert and its trigger. A blocker. A delegate dispatched, with its provider, model, and `taskId`. A gate passed or failed. Not every action.

## Where it lives

- Single-thread work: `.audit/<task-slug>.tsv` in the work dir, not committed.
- Work with PRs someone reviews later: one `planning/<date>-<slug>-rulings.md` on main, updated in one commit per review round, or the trail linked from the PR body. Not a commit per row.

## Rules

- Append only.
- A row written before the evidence exists carries `result: open` and gets a superseding row later.
- Before hand-off, read the last rows against what happened this run. Add rows for any fork or revert that shaped the work but is missing. Never edit history.
