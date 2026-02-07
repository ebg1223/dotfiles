---
description: Build a wave-based plan and dispatch parallel cerebras workers through cerebras_orchestrate.
---
Use this workflow:
1. Clarify scope, constraints, and acceptance criteria.
2. Prefer calling `cerebras_plan_and_orchestrate` first for freeform goals.
3. If explicit waves are already available, call `cerebras_orchestrate` directly.
4. Always use:
   - `workerAgent`: "implementer"
   - `criticAgent`: "critic"
   - `maxConcurrency`: 4 (or less if risky)
   - `maxWorkerAttempts`: 2
5. The workflow must pause for explicit user approval before execution.
6. After execution, summarize completed, blocked, and failed tasks and propose next actions.
