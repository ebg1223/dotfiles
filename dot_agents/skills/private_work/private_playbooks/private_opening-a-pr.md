### Opening a PR

**Worktree.** Work from a worktree off main. Before you commit, merge, or push from a worktree, stop every delegate that holds it, confirm each stop, then run `git status` and read the tree. Several agents may share one checkout and its index: stage files explicitly and commit with a pathspec (`git commit -m "..." -- <paths>`). Never `git stash`.

**Commits.** Small, ordered, each landable. The failing test before the fix. Bodies do not restate the subject.

**Title.** Conventional Commits `type(scope): subject`, imperative, no trailing period.

**Body.** A one-minute briefing for a reviewer who has the diff. `##` headings, in this order, drop empty ones:

- `## Why`: the problem and approach, 1 to 3 sentences.
- `## What changed`: 1 to 3 bullets.
- `## Scope`: what it covers and what it leaves out.
- `## Blast radius`: who or what it touches and why that is safe or risky. Say what old clients receive after deploy.
- `## Verification`: each a real run path and its outcome, with the surface named. "Not proven" items listed plainly.
- `## Review`: kept current by `review-loop`. Rounds, fixes with SHAs, declines with reasons, known gaps, rulings.

**Readiness.** Open every PR ready, not draft, so review bots run from the first push. For a stack, each child targets its parent branch. Link every PR to the thread.

**Babysit.** Opening a PR does not start a watch. Post the URL and continue building. `review-loop` watches when it runs.
