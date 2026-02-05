## Non-negotiables

- Ship production-grade, scalable (>1000 users) implementations; avoid MVP/minimal shortcuts.
- Optimize for long-term sustainability: maintainable, reliable designs.
- Make changes the single canonical implementation in the primary codepath; delete legacy/dead/duplicate paths as part of delivery.
- Use direct, first-class integrations; do not introduce shims, wrappers, glue code, or adapter layers.
- Keep a single source of truth for business rules/policy (validation, enums, flags, constants, config).
- Clean API invariants: define required inputs, validate up front, fail fast.
- Use latest stable libs/docs; if unsure, do a web search.

## Codex behaviour

- If files change unexpectedly, assume parallel edits and continue; keep your diff scoped. Stop only for conflicts/breakage, then ask the user.
- When web searching, prefer 2026 (latest) sources/docs unless an older version is explicitly needed.

## Codex Prompts & Skills

- Skills live in repo `.codex/skills` and global `~/.codex/skills`; if `$<myskill>` isn’t found locally, explicitly load `~/.codex/skills/<myskill>/SKILL.md` (plus any `references/`/`scripts/`).
- Prompts live in `~/.codex/prompts/*.md`

## Coding Style

- Target <=500 LOC (hard cap 750; imports/types excluded).
- Keep UI/markup nesting <=3 levels; extract components/helpers when JSX/templating repeats, responsibilities pile up, or variant/conditional switches grow.

## Security guards

- No delete/move/overwrite without explicit user request; for deletions prefer `trash` over `rm`.
- Don’t expose secrets in code/logs; use env/secret stores.
- Validate/sanitize untrusted input to prevent injection, path traversal, SSRF, and unsafe uploads.
- Enforce AuthN/AuthZ and tenant boundaries; least privilege.
- Be cautious with new dependencies; flag supply-chain/CVE risk.

## Git operations

- Use `gh` CLI for GitHub operations (issues/PRs/releases).
- Ask before any `git push`.
- Prefer Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.).

## Pull requests

- Keep PRs short and structured: **Why** (1–2 bullets), **How** (1–3 bullets), **Tests** (commands run + results).
- Create/manage PRs via `gh pr ...`.
- Avoid noise (logs/dumps); include only key context, risks, and screenshots when UX changes.

## When using the shell

- Prefer built-in tools (e.g. `read_file`/`list_dir`/`grep_files`) over ad-hoc shell plumbing when available.
- For shell-based search: `fd` (files), `rg` (text), `ast-grep` (syntax-aware), `jq`/`yq` (extract/transform).
- Keep it deterministic and non-interactive; limit output (e.g. `head`) and pick a single result consistently.

## Standard Workflow

### First decision: is this a direct, straightforward task? Are you being given a built-out and defined plan? If so, proceed to implementation section. If not, continue to planning

### Planning

- First assumption: don't trust assumptions. If you are given information, validate it in the codebase.
- Gather context from the codebase.
- Seek out sources for documentation assumptions outside libraries that are not clearly defined.
- Help the user work through what they want to achieve, if their goal is overly broad. Reach a state of defined goal.
- Ask the user intelligent and specific questions. Do not make assumptions if you do not know.
- Once you have established a goal and gathered sufficient context, explore the codebase to understand if there may be unintended side-effects as a result of the plan.
- Finalize on a general plan for implementation.
- Iterate through the plan, use specific context, and develop the plan into a set of distinct and actionable steps.

### Implementation

- Understand where we are in the process. If this is a one-off task, just proceed. If this is part of a larger plan, see what is already done if we are not tracking.
- Identify a concrete actionable step or set of steps that are ready for implementation.
- Pull in relevant background information, context, outside resources, etc... Ask the user for help if needed.
- Generate a prompt for the implementer subagent!
  - Implementer subagent is VERY FAST + EFFICIENT
  - It requires a clear task-oriented prompt, as noted in its description.
  - You must check their work, assume it was not done in the best way.
  - Send back changes if you are not satisfied.
- Run the subagent.
- While the subagent is running, you can identify other tasks that can be done in parallel! If so, repeat the prompt generation and spawn another parallel implementer.
- When done, check implementation and run any repo-defined checks. Present a summary to the user.
