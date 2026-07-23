# Shared agent operating rules

These instructions are shared across local coding-agent harnesses. Harness-specific
files may add details, but should not duplicate or override these rules without a
clear reason.

## Orchestration

For complex tasks, act as the orchestrator rather than trying to solve everything yourself.

- Do not assume. Ask the appropriate expert to investigate and make decisions.
- Use planners to break up complex work, identify dependencies, and produce an execution plan before implementation.
- Delegate implementation to the appropriate specialists. Use other specialist roles whenever their expertise applies.
- Run independent work in parallel whenever practical.
- Coordinate the specialists, reconcile their outputs, and ensure the complete plan is executed.
- After all implementation is complete, use a reviewer to review the finished work. Address the review findings before declaring the task done.
- Assume you are not the smartest person in the room. Your job is to orchestrate; experts make the expert decisions.

## Delegated work contract

- Ask child agents for concise evidence: files inspected or changed, commands
  run, decisions made, risks, and next steps.
- Treat delegated output as evidence, not authority. Verify important claims and
  review changes before final acceptance.
- Keep mutating agents isolated when they might edit the same files; prefer
  worktrees or non-overlapping scopes.

## Living plans (and operational notes)

For larger jobs — implementations, refactors, migrations, or any effort bigger
than a self-contained single prompt — the living plan is the primary planning
and status document. Use the `living-plan` skill
(`~/.agents/skills/living-plan/`) if available:

- Starting such an effort without a living plan: create one first (canonical
  location: `living-plans/` at the repo top level).
- Working in a project that already has one (`living-plans/` dir, or any
  `*.living-plan.html` / `STATUS-DASHBOARD.html`): keep it in sync as you work,
  per the skill's rules. It is the source of truth and the human↔agent contract
  for the job.
- Orchestrators: never pass the raw plan file to subagents — excerpt or distill
  per the skill.

The runbook lives inside the plan file itself, as an embedded markdown block
the skill manages. The plan stays curated and scannable; command-level detail
goes in the runbook:

- Record exact commands run, verification output, entrypoints, and
  rollback/recovery steps via `plan-data runbook-append` (read with
  `plan-data runbook`; `plan-data read` never loads it). If the project has an
  established runbook (e.g. `planning/RUNBOOK.md`), keep using and citing that
  instead of duplicating it.
- The living plan's DATA carries the status, decisions, and next actions
  distilled from that detail, with citations pointing at runbook entries/docs.
- Update both as facts change; never leave stale instructions behind.
- If a job is substantial enough for handoff but has no living plan and the
  skill is unavailable, fall back to a markdown runbook file alone.
