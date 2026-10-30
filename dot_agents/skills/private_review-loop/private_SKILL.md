---
name: review-loop
description: The one review gate before merge. Loop one adversarial reviewer on another model family, your own full review, CI and bot comments, and repairs until a round needs no repair. Starts only after the PR's core path has run for real. Use for /review-loop, "review this PR", "get it merge-ready", "has this been through review".
---

# Review loop

Input: a branch or an open PR. You own the loop and you are the final judge. A reviewer's claim is unverified until you check it. Its severity is advice.

A **round** reviews the current head from four sources: one delegate reviewer, your own review, CI, and comments on the PR. The loop ends on a **clean round**: nothing needs repair, CI is green on the head, every comment thread has a reply.

## 0. Run gate

Before round 1, confirm the PR's core path has run for real on this head: a preview, a local server, a device, a script against a real service. Record what ran and what you saw in the PR body's Verification section. If it cannot run here, write `BLOCKED: cannot run <path>` in the todo list and tell the user what would unblock it. Do not start review rounds on code that has never run. Reviewing stands in for running only on a mechanical change such as a rename or a dependency bump, and the reply says so.

## 1. Open and watch

Find the PR with `gh pr view` or open one per **Opening a PR**. Mark it ready so bots run. Link it. Watch it only if it is the PR whose next event changes your next step; in a stack, one watch at a time. Record the head SHA and the merge base (`git merge-base origin/main HEAD` after fetching main).

## 2. Review two ways at once

**Reviewer.** Fill in [reviewer-brief.md](reviewer-brief.md) and dispatch one reviewer on a family that did not write the code (Models table in `work`). Each round is a fresh dispatch with a new `clientRequestId` (`pr<n>-review-r<round>`). Add a second reviewer on a third family only when round 1 found a critical finding.

**Your review.** Read the whole diff against the merge base, not only the fixes. From round 2, start with last round's fixes, then the whole diff again. Run the tests that cover the changed code. Trace what old clients receive after deploy.

Done when every changed file is read, each brief priority has a stated result, and the reviewer's report is in hand.

## 3. Gather the other findings

`gh pr checks` on the current head. Every review, inline comment, and PR comment since the last round. A failed check is a finding. Match each wake-up's SHA to the head; an older head's result is not a finding. A bot's skip notice or preview-link comment is not a finding and gets no reply.

## 4. Judge each finding

Verify each against the code: trace the path, reproduce when cheap. Rate severity yourself and say where you disagree. One disposition each:

- **Repair**: real, reachable under the intended rollout, introduced or exposed by this PR.
- **Decline**: not real, already on main (report separately), contrary to a ruling, or style.
- **Known gap**: real, outside this PR's scope. Recorded in the PR body.
- **Ask**: needs a product, production, or spending decision. One question with your recommendation, and carry on with the rest.

Hold the same bar every round. When a finding is one instance of a pattern, find every instance before repairing. When a finding traces to a wrong statement in your brief, fix the brief.

**Redesign trigger.** If this round's new findings are in code that last round's fix added, stop. Write the premise the fixes share, question it, and change the shape (usually: give the state one owner). A third patch on the same premise is not a repair.

## 5. Repair and record

Small repairs you make yourself. Larger ones go to a fresh implementation delegate with the findings, the rulings, and the repro. Each repair adds at most the test that reproduces its finding, and that test fails on the old head. Run what CI runs for the touched area before pushing: the whole-repo typecheck, related tests, lint.

Push, then reply on each handled thread with the fix SHA or the decline reason, and update the PR body's Review section: round, result, fixes with SHAs, declines with reasons, known gaps, rulings.

## 6. Next round or exit

- A repair was pushed: next round at step 2 on the new head, after the run gate has passed again on that head when the repair touched the core path.
- Nothing needed repair: clean once CI is green on the head and every thread has a reply. If checks are still running, end the turn and let the watch wake you.
- Round cap: four rounds. Then stop and report open findings, what they suggest, and a recommendation.

A finding waiting on the user holds the loop open: finish the rest, then hand off with the question.

## 7. Hand off

`unwatch_pull_request`. Report: PR link, head SHA, each round's result in one line, fixes with SHAs, declines with reasons, known gaps, open questions, CI state, elapsed time and round count. Merge only when the user asked and you have checked readiness on the head yourself.
