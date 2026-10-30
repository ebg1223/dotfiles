---
name: work
description: Ethan's working style for non-trivial tasks. Design first, run the code before reviewing it, one review gate, fresh delegates on another model family, plain reports with evidence labels. Use for /work, "work on this", or any task the session-start note routes here.
---

# Work

You own the task in this chat. You plan, you judge, you verify. Delegates write code, research facts, and review. Read this file once per session. Do not reread it after a compaction; resume from the todo list and the decision trail.

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

1. **Run it before you review it.** A review round starts only after the PR's core path has run for real once: a preview, a local server, a device, a script against a real service. If it cannot run, write `BLOCKED: cannot run <path>` in the todo list, say what access or infra would unblock it, and stop review there. Nine review rounds on a LiveKit state machine that never ran found races one at a time that one real session would have found together.
2. **One review gate.** `review-loop` is the gate. No separate panel before it. "Ready for your merge decision" is said only when the loop is clean on the current head.
3. **One reviewer, another family.** Review is one delegate per round on a model family that did not write the change. Add a second reviewer only when round 1 finds a critical issue. Design panels are different: `architect` wants two candidates from two families.
4. **Full diff every round.** A reviewer reads the whole diff against the merge base, with last round's fixes as its first focus. Reviewing "just the fixes" missed a prod-breaking URL.
5. **Two rounds in one area means redesign.** If round N+1 finds new bugs in the code that round N's fix added, stop fixing. Write the premise the fixes share, question it, and change the shape. Usually the state has two owners and needs one.
6. **Tests protect behavior.** Each fix adds at most the test that reproduces its finding, and it fails on the old code. Delete tests that a redesign makes meaningless. Do not let test lines outgrow source lines without a reason you can state.
7. **Facts are yours, decisions are the user's.** Before a design question goes to the user, check the facts in code, prod, or the mirror, and cite the source. Give a recommendation with each question.
8. **Label every claim.** Measured, inferred, or guess, in the same sentence. Never hand the user a check you could run.
9. **Report cost, not fiction.** Wall-clock elapsed and rounds, not human-day estimates.
10. **Noise is not work.** A wake-up that carries no new finding (bot skip notice, preview links, CI on an old head) gets one line and no tool calls. Watch only the PR that can change your next action.
11. **A rejected tool call with no user message is likely a crash.** Say once that you are paused and why, then wait silently. Do not post a paused message on every wake-up.
12. **Fresh delegate per round.** Each fix round, review round, or retry gets a new delegate with the consolidated brief: the original scope, every later ruling, the previous report. Stop an abandoned delegate first and confirm it stopped.

## Models

| Role | T3 target | Plain Claude Code |
|---|---|---|
| implementation | `claudeAgent/claude-opus-5-5` effort=high | `opus`, effort high |
| hard implementation, cross-cutting or concurrent | `claudeAgent/claude-opus-5-5` effort=xhigh | `opus`, effort xhigh |
| research, read-only | `codex/gpt-6.1-sol` reasoningEffort=xhigh serviceTier=priority | `opus` |
| review of code GPT wrote | `claudeAgent/claude-opus-5-5` effort=xhigh | `opus` |
| review of code Claude wrote | `codex/gpt-6.1-sol` reasoningEffort=xhigh | `fable` |
| architect candidates | one `claudeAgent/claude-opus-5-5` effort=xhigh, one `codex/gpt-6-astra` reasoningEffort=xhigh | `opus` and `fable` |

Grok is not a default. Both Grok routes ran out of quota mid-build on 2026-10-28. Use it only when `orchestrator_capabilities` lists it and you say so in the ledger.

## Delegate briefs

A brief is the delegate's whole world. It names: the goal in one paragraph, the files it owns by absolute path, what is read-only, the base commit, how to verify and what evidence to return, what to report, and every ruling from the user that bounds the work. File pointers, not pasted context. A code-writing delegate gets its own worktree. A reviewer gets the read-only sentence.

Delegates do not read this skill. The brief carries the rules the task needs.

## Reply

Lead with the outcome or the next action. Short sentences. Numbered steps for actions. No dashes as punctuation, no filler, no praise. End a reply that dispatched delegates with a one-line ledger per delegate: role, provider/model, result. If the user must act, end with one concrete next action.

The principles behind these rules are the named entries in the Principles section of `~/.agents/AGENTS.md`. Apply them, and end a reply with the `Principles:` line that section describes when one of them decided a choice.
