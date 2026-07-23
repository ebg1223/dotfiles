---
name: living-plan
description: >
  Create and maintain a living-plan HTML dashboard: a single self-contained
  HTML file that is the plan, runbook, status board, and the live contract
  between humans and agents for a project or program. Use when the user asks
  to create a plan dashboard, "living plan", "living document", status
  dashboard, program dashboard, update/sync the plan, or runs /living-plan.
  Also use proactively: for any job bigger than a self-contained single
  prompt (implementations, refactors, migrations, multi-session efforts),
  and when finishing a meaningful unit of work in a project that has a
  living plan (a living-plans/ dir, *.living-plan.html, or
  STATUS-DASHBOARD.html), update it before declaring the work done.
metadata:
  short-description: "Create/maintain living-plan HTML dashboards"
---

# Living Plan

A living plan is ONE self-contained HTML file that serves four roles at once:

1. **The plan** — milestones, workstreams, dependencies, what "done" means
2. **The runbook/status** — what is live, what is blocked, exact next actions
3. **The onboarding doc** — a stranger reads top-down and understands the
   project in plain language, then drills into technical detail as needed
4. **The contract** — the agreed record between humans and agents: decisions
   ruled vs open, safety rules in force, and the current source of truth.
   If the plan and reality disagree, that is a bug to fix immediately.

It is progressive-disclosure: headline stats → milestone bars → collapsible
detail. Every claim cites its source (planning doc, PR, commit, run id).

## Core mechanics (never violate these)

- **All content lives in one `const DATA = {...}` JS object** at the top of
  the file. Rendering below it is generic and content-free. To update the
  document you edit DATA only. Never hardcode content into the HTML body.
- **Never read or rewrite the whole HTML file.** The ~14KB of CSS/renderer
  is universal boilerplate; keep it out of context. Use the helper in this
  skill dir (`<skill-dir>/scripts/plan-data`, node script):
  ```bash
  scripts/plan-data read  <plan.html>            # DATA object only → stdout (no runbook)
  scripts/plan-data write <plan.html> <data.js>  # replace DATA (or `-` = stdin)
  scripts/plan-data check <plan.html>            # parse-verify + list sections
  scripts/plan-data runbook <plan.html>          # embedded runbook markdown → stdout
  scripts/plan-data runbook-append <plan.html> <md|->  # append an entry to the runbook
  ```
  Workflow: `read` into a temp file, edit that, `write` it back. `write`
  validates the payload parses before touching the file and leaves a
  `.bak`; remove the `.bak` after confirming. For small surgical edits you
  may search_replace directly inside the DATA block.
- **DATA shape is per-plan, not fixed.** The template's sections are a
  starting vocabulary, not a schema. Each plan should carry exactly the
  sections its project needs — invent new ones (risk registers, parity
  matrices, environment inventories...) when the project genuinely calls
  for it. A novel section needs a matching render block: add one small
  `if (has(DATA.x)) section(...)` following the existing patterns. This
  is the ONE legitimate reason to touch the renderer — do it when creating
  a plan or during reconciliation (see below), never during routine status
  sync, and keep the renderer content-free (all content stays in DATA).
- The file must stay **fully self-contained**: no external JS/CSS/fonts/CDN.
  It must render from `file://`, a dumb static server, or an email attachment.
- **Two-layer language everywhere.** Each milestone/track item carries:
  - `plain`: 2-4 sentences a newcomer understands — what it is, why it
    matters, what's actually left. No project lingo without explanation.
  - `details`: the precise technical record with citations (doc numbers,
    PRs, run ids, exact counts/dollars). Never delete facts to simplify;
    move them into `details`.
- **Append, don't erase history.** Completed phases stay (collapsed).
  Superseded plans get status changes, not deletion. `updateLog` gets a
  dated entry on EVERY edit, newest first.
- After any edit, **verify DATA still parses** (see Verification) before
  telling the user you're done.

## When to CREATE a new living plan

Trigger: user starts a substantial multi-session effort, or asks for one.

1. **Assess first, write second.** Read the relevant planning docs, code,
   and git history. For large corpora, fan out parallel explore subagents
   (plan/goals, execution history, current ops state, code map) and
   reconcile their reports. Do not invent status — cite evidence.
2. **Design the document around the task, not the template.** Before
   writing, decide: what is the ONE number/state the owner checks daily?
   What shape is the work (build arc? ops campaign? migration? research)?
   What vocabulary does this project actually speak? The document's
   sections, names, metrics, and pipeline steps must come from the task
   itself — a billing campaign tracks claims and dollars, a migration
   tracks cutover lanes and parity, a research effort tracks questions and
   evidence. A living plan that could describe any project describes none.
3. Copy the skeleton from `references/TEMPLATE.html` in this skill dir to
   the project. Canonical location: a `living-plans/` directory at the top
   level of the repo, named `living-plans/<job-name>.living-plan.html`
   (create the directory if missing). Only deviate if the project already
   keeps its living plan elsewhere (e.g. next to an established planning
   docs tree). Populate DATA — renaming, reshaping, and replacing sections
   per your design from step 2.
   Every plan carries an **embedded runbook**: a markdown block inside the
   same HTML file (`<script type="text/markdown" id="runbook">`, invisible
   in the rendered view, never loaded by `plan-data read`). If the project
   already has an established runbook, cite that instead of duplicating it.
   The division of labor:
   - **Plan (DATA)**: curated and scannable — status, milestones,
     decisions, next actions, plain-language narrative. Never raw logs.
   - **Runbook (embedded markdown)**: operational detail — exact commands
     and entrypoints, verification output, session notes, environment
     setup, rollback/recovery steps. Grows freely; append-only via
     `plan-data runbook-append` (each entry a dated `##` heading).
   - The plan cites runbook entries (per-item refs like "runbook
     2026-07-22"); facts flow runbook → distilled into plan; DATA never
     duplicates command detail.
4. Baseline DATA sections (a vocabulary, not a checklist — rename and
   reshape freely; omit what doesn't apply, keep the layered structure):
   - `meta` — title, one-line subtitle, `asOf` date, `sources`
   - `orientation` — the "Start Here" layer: `what`, `why`, `how` (pipeline
     steps as "VERB — explanation"), `principles` (standing rules/ground
     rules in force), `whereWeAre`, `glossary` (every piece of project
     lingo used anywhere else in the document)
   - `headline` — up to 6 stat cards (the numbers an owner checks daily)
   - `milestones` — the build arc with `status`, `pct`, `plain`, `details`
   - `tracks` — current workstreams with per-item status (the runbook layer)
   - `nextActions` — prioritized (1=next), each with a `ref` citation
   - `decisions` — `ruled` (settled, binding, with refs) vs `open`
     (blocking questions awaiting a human). This is the heart of the
     contract: agents MUST NOT act against a ruled decision or silently
     resolve an open one.
   - `phases` — execution history, grouped, collapsed by default
   - `updateLog` — dated changelog of the document itself
   - Task-specific sections: the domain timeline/metric table (dollars,
     claims, users, records migrated...), risk/contract registers,
     `codeMap`, environment inventories — whatever THIS task needs.
5. Statuses: `done | live | in_progress | designed | not_started | blocked |
   ruled | open`. Use them consistently; the template styles all of them.
   Add task-specific statuses if the domain has states these can't express.
6. If the machine has a plans server (`~/plans` + plans-server service),
   symlink the file in: `ln -sfn <abs-path> ~/plans/<short-name>.html`.
7. Commit per the project's commit policy (docs-only usually goes straight
   to main).

## When to UPDATE an existing living plan (the sync loop)

This is the ongoing contract duty. After completing any meaningful unit of
work in a project that has a living plan — a milestone step, a fix, a run,
a decision from the user — sync the document as part of finishing the work.
(Routine sync changes content within the existing structure; if the
structure itself no longer fits, that's a reconciliation — see next
section.)

1. **Read before writing.** `plan-data read` the current DATA (never the
   whole file); understand what it claims.
2. Apply the delta, keeping both layers honest:
   - status/pct changes on affected milestones/tracks/items
   - update `plain` if the newcomer story changed; append to `details`
     with citations for what happened
   - move finished `nextActions` out; add newly unblocked ones
   - record any new user ruling under `decisions.ruled` (with date/ref);
     add newly surfaced questions under `decisions.open`
   - refresh `headline` numbers and `meta.asOf`
   - append an `updateLog` entry (date + one-line summary)
   - operational detail from the work (commands run, verification output,
     recovery notes) goes in the embedded runbook via `plan-data
     runbook-append`, cited from the plan — not into DATA
3. **Do not editorialize away bad news.** Blocked is blocked; failed runs
   are recorded. The document's value is that it is true.
4. Drift check while you're in there: if you notice the document disagrees
   with reality anywhere (not just your delta), fix it and note it in the
   updateLog.
5. Verify, then commit/push per project policy. The live server (if any)
   picks up the change on refresh — no restart needed.

## Orchestrating from a living plan (subagents)

The plan file is the orchestrator's source of truth for the whole job —
it is NOT a handout. Never tell a subagent to "read the plan.html file":
they'd burn context on 14KB of CSS/renderer plus every section irrelevant
to their slice, and worse, they may treat the whole document as their
scope or act on parts of the contract they shouldn't touch.

Instead, the orchestrator reads the plan (via `plan-data read`) and:

- **Excerpts**: paste only the relevant slice into the subagent prompt —
  the one track's items, the ruled decisions that constrain this work,
  the specific next action with its refs.
- **Distills**: usually better — write the subagent a purpose-built
  prompt informed by the plan (scope, constraints, citations to follow),
  rather than quoting it.
- **Owns the write-back**: subagents report results; the orchestrator
  applies them to the plan. A subagent only edits the plan if that
  editing is itself its explicitly delegated task (and then via
  `plan-data`, scoped to named sections).

Always pass down the relevant ruled decisions and standing rules
(`orientation.principles`) as constraints in the prompt — that part of
the contract must reach every worker, in prompt form, not as a file
reference.

## Reconciliation — keep the STRUCTURE alive too

Routine sync keeps the content true; reconciliation keeps the document
itself fit for the project it now describes. Projects outgrow their plans:
milestones complete and stop being the story, a side worklist becomes the
main event, a section that once earned its space becomes noise.

Do a reconciliation pass when: a milestone/track completes or a new one
starts; the user asks for an assessment, regroup, or "where are we";
priorities visibly reorganize; or routine syncs have started to feel like
they're forcing updates into sections that no longer fit.

During reconciliation, restructuring is not just allowed — it is expected.
Actively look for and make these improvements:

- **Promote / demote**: yesterday's headline metric that nobody checks
  anymore gives its card to today's; a track item that grew into the main
  effort becomes its own track or milestone; a completed arc collapses
  into a single history phase.
- **Reshape sections**: split a track whose items have diverged; merge
  sections that are saying the same thing; add a new task-specific section
  the project now needs; retire one that stopped earning its space (fold
  its facts into history — never silently drop them).
- **Rewrite the narrative**: `orientation.whereWeAre` and milestone
  `plain` text describe the CURRENT chapter, not the one where they were
  written. Re-read them as a newcomer would and rewrite what's stale.
  Prune glossary terms no longer used; add ones that crept in.
- **Re-baseline next actions**: rebuild the queue from current reality
  rather than patching the old list.

Rules that still hold during reconciliation: history is append-only
(restructure the present, never rewrite the past); facts move, they don't
disappear; renderer edits follow the "DATA shape is per-plan" mechanic;
log the restructuring itself in `updateLog` ("reconciled: promoted X,
merged Y/Z, retired W"). If the restructuring changes what the document
claims the team is doing — confirm direction with the user first;
reconciliation updates the contract, it must not unilaterally rewrite it.

## Verification (always, after create or update)

```bash
<skill-dir>/scripts/plan-data check <plan.html>
```

Also sanity-check that every glossary-worthy term you introduced in `plain`
text is either self-explanatory or in `orientation.glossary`.

## Style rules

- **Tailored beats generic, everywhere.** Milestone names say what they
  mean in this domain ("M2 Money — attach dollar amounts", not "Phase 2").
  Headline cards are the task's own vitals. Pipeline steps are the task's
  actual verbs. Section captions, glossary, statuses — all in the
  project's language. If a sentence would fit in any other project's plan,
  rewrite it until it wouldn't.
- Plain layer: short sentences, no acronym without expansion, explain
  *why it matters*, name dollar/count stakes when real.
- Technical layer: exact numbers, ids, and citations — this is the record
  an auditor or future agent reconstructs from.
- Keep the top-level scan view stable and small; growth goes inside
  collapsed panels. If the file feels "massive", you put prose at the top
  level that belongs in a collapsed `details`/`plain` field.
- Light mode, no external deps, no build step. Section captions (one line
  under each heading) tell a newcomer what each section is for.
