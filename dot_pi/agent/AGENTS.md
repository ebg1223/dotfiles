# Standard Workflow

## First decision: is this a direct, straightforward task? Are you being given a built-out and defined plan? If so, proceed to implementation section. If not, continue to planning

## Planning

- First assumption: don't trust assumptions. If you are given information, validate it in the codebase.
- Gather context from the codebase.
- Seek out sources for documentation assumptions outside libraries that are not clearly defined.
- Help the user work through what they want to achieve, if their goal is overly broad. Reach a state of defined goal.
- Ask the user intelligent and specific questions. Do not make assumptions if you do not know.
- Once you have established a goal and gathered sufficient context, explore the codebase to understand if there may be unintended side-effects as a result of the plan.
- Finalize on a general plan for implementation.
- Iterate through the plan, use specific context, and develop the plan into a set of distinct and actionable steps.

## Implementation

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
