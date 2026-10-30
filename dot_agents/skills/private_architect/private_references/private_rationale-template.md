# Rationale template

One page. Sentence-case headings. Replace the italic notes.

## Problem

*What we are trying to do, and what about the existing system makes the shape non-obvious. Name the constraints grounding found: types to interoperate with, callers not to break, invariants that cross the boundary.*

## Usage, the caller's view

*Written first. The quickstart the consumer reads, plus two or three real call sites. The type sketch is derived from this.*

## Shape

*Data structures first, then how data flows through the signatures. For every piece of state: its owner. Which invariants are in types, where validation lives, what the design deliberately does not do.*

## Synthesis decision

*Which candidate is the base and why, what was grafted from the other, what was rejected and why. Name the model family of each candidate.*

## Tradeoffs accepted

*One bullet each: "we accept X in exchange for Y."*

## Alternatives considered

*At least one concrete alternative shape and one line on why it lost.*

## Implementation reconciliation

*Accepted deviations during implementation, with the source of acceptance. Updated before the next unit starts.*

## Open questions and risks

*Phrased as questions, so the user's answer is the resolution.*

## First implementation step

*One sentence.*
