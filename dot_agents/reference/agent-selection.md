# Agent and model selection guide

This is the shared routing guide for agent workflows. Keep provider-, project-,
and harness-specific exceptions near their projects, and keep reusable routing
policy here so there is one source of truth for model tradeoffs.

## Core principle: fastest agent that can actually do the job

Default to the **fastest, cheapest model that can complete the task correctly**.
Speed and parallelism matter, but do not chase speed off a cliff:

- If the task's complexity would outrun a fast model, step up before it thrashes,
  backtracks, or ships a plausible-but-wrong result.
- Match the model to the **hardest** part of the task, not the average part.
- Use expensive high-judgement models for judgement, synthesis, review, and hard
  reasoning — not for bulk throughput.

General priority order: **parallelism, correctness, and minimizing scarce premium
model tokens**. When axes conflict for anything that ships:

**correctness > required reasoning > taste/design quality > speed > cost**.


## Capability axes

Rankings are relative and should be updated when local provider economics or
model quality changes. **Higher is better in every category.** For `cost`, a
higher score means more cost-efficient / cheaper to use; `10` means lowest cost,
not most expensive.

Current local model rankings:

| model | pi model tag | cost | intelligence | taste | speed | notes |
|-------|--------------|------|--------------|-------|-------|-------|
| `gpt-5.5` | `openai-codex/gpt-5.5` | 8 | 5-8 | 5 | 7 | intelligence varies by effort: low through xhigh |
| `grok-composer-2.5-fast` | `cliproxyapi/grok-composer-2.5-fast` | 9 | 5 | 4 | 9 | fast coding model with better reliability than raw speed models |
| `devin/windsurf swe-1.6:fast` | `windsurf/swe-1.6:fast` | 9 | 4 | 3 | 10 | fastest mechanical/recon option |
| `sonnet-5` | `cliproxyapi/claude-sonnet-5` | 5 | 5 | 7 | 6 | strong taste/design at moderate speed |
| `opus-4.8` | `cliproxyapi/claude-opus-4-8` | 4 | 7 | 8 | 4 | stronger design/reasoning, slower and less cost-efficient |
| `fable-5` | `cliproxyapi/claude-fable-5` | 2 | 9 | 9 | 2 | premium judgement and final adjudication |

## Route by work type

### Information gathering

Use fast or mid-tier agents. Codebase recon, docs lookup, source mapping, and
fact collection are not judgement work. Ask for evidence and compressed context;
do not let the gatherer make the final decision when the decision is risky.

### Bulk, mechanical, or clear-spec implementation

Use fast coding agents when the change is well-scoped and easy to verify. Require
verification and review before trusting the result, especially when the model's
reasoning score is below the bar for the task.

### Planning and hard implementation

Use strong reasoning agents for decomposition, risky implementation choices,
ambiguous requirements, concurrency/state/security correctness, migrations with
unknown edge cases, or anything that must be reasoned through unsupervised.

### User-facing design, copy, UI, and API shape

Use agents with strong taste/design quality. If a cheap implementation agent
builds the first pass, review or refine it with a stronger taste model before
shipping.

### Review and adjudication

Use stronger independent reviewers than the implementation agent. For important
work, prefer diverse review lenses: correctness, security, performance,
maintainability, UX/API, and test coverage. For contentious findings, add an
adversarial verifier prompted to refute the claim.

## Preliminary review after low-reasoning implementations

Any implementation done by a model intelligence <5 should get a preliminary
review before final orchestrator review:

```text
fast implementation -> mid/strong preliminary review -> orchestrator/final review
```

We need to not only verify we did the correct things, but for these models, that they actually did everything they report having done.

This catches cheap-model failure modes early so scarce premium review is spent on
real judgement instead of cleanup.

## Parallelism patterns

- Split independent discovery work across agents.
- Keep mutating agents isolated when they could edit the same files.
- Use barriers only when the next step genuinely needs all previous results
  together, such as deduplication or cross-item comparison.
- Prefer pipelining when each item can advance independently through stages.

## Escalation rules

- Judge output quality, not the price tag. If a cheaper model misses the bar,
  rerun or redo with a stronger model without asking unless the user constrained
  cost/model choice.
- Never let a fast model make a judgement call it cannot support. Gathering: yes.
  Deciding: escalate.
- Make bounded coverage explicit. If a workflow samples, caps, or skips cases,
  report what was not covered.
