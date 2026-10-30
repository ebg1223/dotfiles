# Reviewer brief

Fill every `<...>`. Drop lines that do not apply. Round 1 has no prior rounds.

---

Adversarial code review, round <n>, of GitHub PR #<number> (<owner/repo>), "<title>". Review the whole PR fresh, verifying this round's fixes first.

Checkout: <abs path>, branch <branch>, HEAD <sha>. Merge base with origin/main: <sha>. Whole diff: `git diff <merge-base>...HEAD`. This round's fixes: `git show <sha>`.

Read-only for the repo: do not edit, commit, stash, push, or comment on GitHub. Other agents share this checkout. You may run tests and typechecks; read the AGENTS.md of each package you test first. <Local stacks you may probe with synthetic data, and how to reach them.>

Context: `gh pr view <number>` for the PR body: what was fixed, declined, known gaps, rulings. Do not re-report a listed item unless you show its reasoning is wrong.

What has run for real on this head: <surface and result>. <Rollout facts the diff does not show: flags and defaults, what is live, rulings that bound the review.>

## Prior rounds

<Round k: each finding in one line: FIXED <sha>, DECLINED <reason>, or KNOWN GAP. Unresolved objections.>

## What to review, in priority order

a. This round's fixes: complete and correct, including every consumer of what they changed. Did the fix add a new bug?
b. Other instances of the patterns earlier rounds found.
c. The whole diff: wrong data written or read; lost or duplicated work; two writers of one piece of state; something reported done that is not; a security or authorization hole; behavior with the PR's flags off; migrations against the shape of production data; what web, native, or headless clients receive after deploy. <Areas earlier rounds covered least.>

## Report

For each finding: severity (critical, major, minor), file:line, the defect in one sentence, a concrete failure scenario (inputs and state, then the wrong outcome), evidence (the path traced and what you ran), a brief suggested fix.

Separate confirmed findings, traced end to end or reproduced, from plausible ones. Skip style. If nothing major remains, say so plainly. The final message is the report only.
