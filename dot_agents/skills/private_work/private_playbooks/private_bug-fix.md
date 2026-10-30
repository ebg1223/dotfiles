### Bug fix

Every shipped line traces to runtime evidence. A change that "might help" is a hypothesis and does not ship.

1. **Reproduce** on the matching surface yourself. If it will not reproduce, tighten conditions or instrument until it does. Ask the user only with a specific reason the surface is out of reach, and after driving it as far as it goes.
2. **Find the mechanism.** List candidate causes. Each pass, take the split that removes the most candidates, get runtime evidence, eliminate. Instrument when state is unclear. Confirm the surviving mechanism with evidence before planning a fix.
3. **Check the pattern.** Grep for the same shape elsewhere. Fix all instances or say why not.
4. **Plan the fix.** If it crosses a function boundary or adds state, `architect` first. Delegate implementation with the mechanism and the repro in the brief.
5. **Verify** on the same surface. The original repro now passes. Unit tests show branch behavior, not bug absence.
6. **Commit** the failing repro before the fix in history when a cheap local test exists.
7. `review-loop`, then **Opening a PR**.

**Reply:** what was broken, the mechanism, the fix, how you verified. Quote the decisive failing and passing output, trimmed to the assertion and counts.
