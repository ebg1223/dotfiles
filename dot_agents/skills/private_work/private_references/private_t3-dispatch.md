# T3 dispatch

How `work` and its skills run on T3 Code. Read once per session, before the first delegate.

## Tools

| Need | Call |
|---|---|
| Capabilities, once per thread | `orchestrator_capabilities`. Copy provider instance IDs and option IDs from its result, never from memory. |
| Start a delegate | `delegate_task` with `mode: "async"`, a `role` (`implementation`, `research`, `review`, `design`, `test`), a `target` from the Models table in `work`, a `title`, and a `clientRequestId` that names the round (`pr620-review-r3`). Keep the `taskId` and `childThreadId`. |
| N delegates in parallel | N `delegate_task` calls in one response. |
| Wait for a result | End the turn. The completion wakes this thread. `task_status` only when you need a result mid-turn. |
| Next round | A new `delegate_task` with the consolidated brief. Never `t3_thread_send` to a child. |
| Stop a delegate | `task_cancel`, then confirm with `task_status`. |
| Read what a child did | `t3_thread_read` on its `childThreadId`, bounded by `maxCharsPerItem`. |
| Open a PR | `gh pr create`, then `link_pull_request` with the URL. Link every layer of a stack. |
| Wait for CI or a human review | `watch_pull_request` on the one PR whose change alters your next action. `unwatch_pull_request` before you hand back. |
| Web proof | `preview_open`, `preview_snapshot`, act by `aria-ref`, `preview_snapshot` with `save: true` for evidence. Embed the returned path. |
| Device proof | `device_list`, `device_open`, the returned `agent-device` command, `device_screenshot`. |

## Worktrees for code-writing delegates

`delegate_task` has no workspace of its own. For a delegate that writes code:

1. Commit your current work. Record `git status --porcelain`.
2. `git worktree add <abs-path> -b <delegate-branch> HEAD`.
3. The brief names that path as the only place it writes and tells it to run every command from there.
4. After you take the result, confirm your checkout is unchanged, then remove the worktree and its branch.

Several delegates may share one checkout only when each one owns disjoint files and the brief says so. Fencing a file in prose is not a lock.

## Wake-ups

A PR watch wakes the thread on failed checks, passing required checks, new comments from other accounts, conflicts, and close. Many wakes carry nothing: a bot's "skipped, base is not main" notice, preview links, CI on a head you already replaced. For those, reply in one line and make no tool calls. Match the SHA in the wake to the current head before you act.

Watch one PR at a time: the one whose state changes your next step. In a stack under review, that is the PR currently in a round, not every layer.

## Ledger

End a reply that dispatched work with one line per delegate: role, `providerInstanceId/model`, outcome. A reply with no dispatches says so in one line.
