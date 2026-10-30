---
name: architect
description: Sketch the shape before the code. Ground in the existing system, get two candidate designs from two model families, screen them, synthesize one, then implement against it and scrap it if the pattern says it is wrong. Use for /architect, "design this", or any change that crosses a function boundary or adds state.
---

# Architect

The output is a one-page design: the caller's usage first, then types and signatures with `not implemented` bodies, then the rationale from [references/rationale-template.md](references/rationale-template.md). Code is written against it afterwards.

## 1. Ground

Build a real model of every system the change touches. Read the code. Name the existing primitives in a table: what each one models, where it lives. Name the gap in one sentence: what the system does not model that this change needs. Dispatch read-only `research` delegates for facts you cannot see from the code: prod data shapes, infra reach, vendor limits. Continue with what does not depend on them. End grounding with one question for the sketches: if this requirement had existed when the system was first built, what shape would it have? Bolting the change onto the current shape is one candidate, not the default.

Skip grounding only when the work is greenfield.

## 2. Sketch, twice

Dispatch two candidate runners in one response, on two different model families (Models table in `work`). Each gets [references/runner-prompt.md](references/runner-prompt.md), the grounding from step 1, the task, and a path to write its package. Runners write design files only, no code.

Two candidates is the floor. A third runs only when the first two converge on one shape and you suspect the space is wider.

## 3. Screen and synthesize

Screen each candidate against [references/design-red-flags.md](references/design-red-flags.md). Compare on interface depth: prefer the design that hides more behind a smaller public surface. Ask of every piece of state: who owns it, who else writes it. Two writers is a red flag that showed up as nine review rounds on the last build.

Synthesize one design. Record which candidate is the base, what was grafted, what was rejected and why, in the rationale's "Synthesis decision".

## 4. Agree

Run `grilling` on the synthesized design when it contains product or scope questions. Check facts before each round. Record rulings in the design doc. Default otherwise: proceed without a checkpoint and report the design in the reply.

## 5. Implement against the sketch

Replace bodies with code. A deviation from the sketch is a signal: was the sketch wrong, a requirement missed, or the implementation overreaching? Record accepted deviations in the rationale's "Implementation reconciliation" before the next unit starts.

## 6. Scrap when the pattern says so

Throw the sketch out when the same workaround shape repeats, types need escape hatches, a lock appears for state the sketch said was unshared, or two fix rounds in one area each introduced the bug the next round found. Re-ground, redesign as if the new constraint were day one, subtract before adding, and return to step 2.

## Reply

The design in a table of primitives, the shape, the synthesis decision, tradeoffs accepted, open questions as questions. Name which family produced each candidate.
