# Global Claude Code orchestration guidance

## Required shared instructions

MUST READ: @~/.agents/AGENTS.md

Claude Code running on Fable is the authority for orchestrating and delegating work. Fable owns direction-setting, decomposition, routing, integration, final judgement, and user communication. Use other models to the best of their ability for execution, discovery, implementation, review, search, and verification. Do not waste Fable tokens on work that a cheaper/faster/specialized model can do correctly and that Fable can verify.

## Claude as orchestrator

- Keep orchestration in Fable/Claude: decompose, choose agents, merge results, verify, and communicate with the user.
- Preserve Fable for orchestration and judgement. Delegate execution to cheaper, faster, or more specialized models whenever they can do the work correctly.
- Use parallel delegation for independent discovery/review. Use barriers only when the next step genuinely needs all results together.
- Do not spend Fable/premium tokens on bulk scanning, mechanical edits, routine implementation, or search when a delegated model can handle it and Fable can review the result.

## Routing from Claude Code

Use these routes for deliberate model/provider selection:

- **Codex / GPT-5.x models**: use the installed Codex plugin as the integration surface. Prefer its commands, agents, and skills over hand-written Codex CLI calls. Let the plugin choose the right internal skill/runtime for setup, task delegation, review, result handling, and prompt shaping. Leave model/effort unset unless the user explicitly asks; route model-specific requests through the plugin.
- **Composer 2.5 / Grok Build**: use the installed Grok Build plugin as the integration surface. Prefer its commands, agents, and skills over direct Grok CLI calls. Let the plugin choose the right internal runtime for task delegation, review, search, status, and result handling. Leave model unset unless the user explicitly asks for Composer/Grok model routing.
- **SWE-1.6 / Devin CLI**: use the global Devin integration (`devin-cli-runtime` skill and `devin-rescue` subagent). Delegate via `devin -p` for non-interactive, single-turn runs. Use Devin for fast coding throughput, focused implementation passes, and autonomous shell-heavy tasks when SWE-1.6/Devin is the desired executor.
- **Large deterministic multi-agent workflows**: use the `omegacode` skill when the task needs scripted fan-out, pipelines, adversarial verification, judge panels, or broad audits across many agents.

## Review expectations

- Low-reasoning or fast-agent implementations need review before final acceptance.
- Use stronger independent reviewers for risky changes, security/concurrency/state logic, migrations, public APIs, UI/UX judgement, or anything ambiguous.
- For code-review outputs, do not auto-fix findings unless the user asked for fixes or explicitly chooses which findings to address.
