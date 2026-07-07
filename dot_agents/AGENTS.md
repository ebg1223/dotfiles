# Shared agent operating rules

These instructions are shared across local coding-agent harnesses. Harness-specific
files may add details, but should not duplicate or override these rules without a
clear reason.

## Shared agent/model selection

MANDATORY, NO EXCEPTIONS: before every delegation — including quick smoke tests,
throwaway checks, or "just verifying something works" — you MUST actually read
@~/.agents/reference/agent-selection.md (or recall its contents from
having read it earlier in this same session) before picking a provider/model.
Do not default to a habitual model choice and rationalize it afterward as
"obviously fine" — verify against the guide first, even when you expect the
answer to match your instinct. Use the absolute path because this file is
symlinked into multiple harness config directories.

Core rule: choose the fastest/cheapest agent that can actually complete the task
correctly, but for anything that ships prefer correctness over reasoning depth,
taste, speed, or cost.

If you realize partway through a task that you picked a model without checking
the guide, stop and say so explicitly rather than quietly continuing.

## Delegated work contract

- Ask child agents for concise evidence: files inspected or changed, commands
  run, decisions made, risks, and next steps.
- Treat delegated output as evidence, not authority. Verify important claims and
  review changes before final acceptance.
- Keep mutating agents isolated when they might edit the same files; prefer
  worktrees or non-overlapping scopes.

## Runbooks and working notes

When work has an operational procedure, migration path, multi-step plan,
deployment sequence, or long-running investigation, keep a runbook or planning
note up to date while working.

- Prefer existing project locations such as `planning/RUNBOOK.md`,
  `planning/*.md`, or the repo's established runbook path.
- Record commands run, verification results, known blockers, current state,
  remaining steps, and rollback/recovery notes when relevant.
- Update the runbook as facts change; do not leave stale instructions behind.
- If no runbook exists and the task is substantial enough to need handoff,
  create one in the project's planning/docs area unless the user asked not to.
- Keep runbook updates factual and concise; avoid dumping raw logs unless a short
  excerpt is needed as evidence.
