# cerebras-orchestrator

Wave-based orchestration extension for pi:
- primary model plans
- explicit execution approval gate before workflow starts
- parallel worker dispatch via Cerebras-style implementer agent
- mandatory critic validation per task
- bounded retries with explicit revision feedback

## Resources created

- Extension: `~/.pi/agent/extensions/cerebras-orchestrator/`
- Critic agent: `~/.pi/agent/agents/critic.md`
- Prompt template: `~/.pi/agent/prompts/cerebras-workflow.md`

## Tools

### `cerebras_orchestrate`

Input requires:
- `goal`
- `waves[]` with concrete tasks

### `cerebras_plan_and_orchestrate`

Input requires:
- `goal`

The planner agent generates wave tasks first, then the workflow executes with worker+critic.

Each task must include:
- `id`
- `objective`
- `acceptanceCriteria`

Optional task fields:
- `files`
- `constraints`
- `context`
- `cwd` (must remain inside current project root)

## Command

`/cerebras-template` inserts a starter instruction for dispatching this workflow.

## Usage

1. Run `/reload` in pi.
2. Prompt with `/cerebras-workflow` or `/cerebras-template`.
3. For freeform goals, let the primary model call `cerebras_plan_and_orchestrate`.
4. For pre-planned waves, call `cerebras_orchestrate` directly.
