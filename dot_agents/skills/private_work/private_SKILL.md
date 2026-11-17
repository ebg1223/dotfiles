---
name: work
description: Ethan's working style for non-trivial tasks. Design first, run the code before reviewing it, one review gate, fresh delegates on another model family, plain reports with evidence labels. Use for /work, "work on this", or any task the session-start note routes here.
---

# Work

You own the task in this chat. You plan, you judge, you verify. Write bounded changes yourself. Delegate a unit when it is independent, runs in parallel, or needs another model family's judgment. Read this file once per session. Do not reread it after a compaction; resume from the todo list and the decision trail.

On T3, read [references/t3-dispatch.md](references/t3-dispatch.md) before the first delegate. On plain Claude Code, delegates go through the `Agent` tool with `subagent_type: "delegate"` and an explicit `model`.

## Route

Pick one playbook and open a todo list with its steps verbatim. A skipped step stays in the list as `skip: <reason>`.

| Task | Playbook |
|---|---|
| New or changed behavior | [playbooks/feature.md](playbooks/feature.md) |
| A defect with a known symptom | [playbooks/bug-fix.md](playbooks/bug-fix.md) |
| A PR or stack to drive to merge-ready | the `review-loop` skill |
| Any playbook, at the end | [playbooks/opening-a-pr.md](playbooks/opening-a-pr.md) |

Skills this routes to:

- `architect`: the shape before the code, two candidates, one synthesis.
- `review-loop`: the only review gate. One reviewer per round on a family that did not write the code.
- `decision-trail`: one TSV of rulings for work that runs longer than one sitting or that someone reviews later.
- `grilling` and `research` (user skills): grill before a design is final; research any fact the design depends on.

## Rules that came from experience

1. **A rejected tool call with no user message is likely a crash.** Say once that you are paused and why, then wait silently. Do not post a paused message on every wake-up.
2. **Fresh delegate per round.** When a round uses a delegate, start a fresh one with the consolidated brief: the original scope, every later ruling, the previous report. Stop an abandoned delegate first and confirm it stopped.

## Models

Read `~/.agents/reference/models.md` before the first delegate. It is the one table of roles, T3 targets, and plain Claude Code models.

## Delegate briefs

A brief is the delegate's whole world. It names: the goal in one paragraph, the files it owns by absolute path, what is read-only, the base commit, how to verify and what evidence to return, what to report, and every ruling from the user that bounds the work. File pointers, not pasted context. A code-writing delegate gets its own worktree. A reviewer gets the read-only sentence.

Delegates do not read this skill. The brief carries the rules the task needs.

## Reply

Lead with the outcome or the next action. End a reply that dispatched delegates with a one-line ledger per delegate: role, provider/model, result. If the user must act, end with one concrete next action.

The principles behind these rules are the named entries in the Principles section of `~/.agents/AGENTS.md`. Apply them, and end a reply with the `Principles:` line that section describes when one of them decided a choice.
