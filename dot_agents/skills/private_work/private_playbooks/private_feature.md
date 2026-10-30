### Feature

You own the design. Delegates implement. You verify.

1. **Ground.** Read the subsystem the change touches. Name the data shape and its owner before any code. If a fact the design depends on is unknown, dispatch a read-only `research` delegate now and continue with what does not depend on it.
2. **Design.** Run `architect` when the change crosses a function boundary or adds state. Run `grilling` on the result when the user must rule on product or scope questions. Record rulings in the design doc or the decision trail.
3. **Harness.** Name the real surface the feature will be proven on: preview, local server, device, script against a service. If that surface does not exist yet, build it first. If it cannot exist in this environment, write `BLOCKED: cannot run <path>` and ask the user before building further. The riskiest slice gets the harness first.
4. **Slice.** Split into units that each end in a check. Independent units with disjoint files run in parallel, one delegate each, each in its own worktree. Shared files mean one owner.
5. **Delegate.** One brief per unit: goal, owned paths, base commit, data shape and owner, verification to return, rulings that bound it. Implementation model from the Models table. Hard units (cross-cutting, concurrent, subtle) go to the strongest model.
6. **Verify.** Run the unit yourself on the harness from step 3. The delegate's report is a claim until you have seen the artifact. Typecheck and tests in addition, not instead.
7. **Commit.** Small ordered commits. Failing test, then fix, when a test exists. Stack follow-ups as PRs on the parent branch.
8. **Review.** Run `review-loop` on each PR. It starts only after step 6 passed on the current head.
9. Run **Opening a PR** for each PR you open.

**Reply:** what you built, for whom it changes what, what you chose and why, what you proved and on which surface, what is unproven, open decisions.
