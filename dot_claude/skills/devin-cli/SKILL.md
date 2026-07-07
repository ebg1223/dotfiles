---
name: devin-cli-runtime
description: Delegate work from Claude Code to Devin CLI/SWE-1.6. Use when the user asks for Devin or SWE-1.6, when Claude needs a fast implementation or diagnosis pass from Devin, or when wrapping Devin as a delegated coding agent from Claude Code.
---

# Devin CLI runtime

Use this skill to delegate a focused task to the local `devin` CLI from Claude Code. Claude remains the orchestrator: shape the task, invoke Devin once, then verify and integrate the result.

Primary non-interactive command for read-only diagnosis/planning:

```bash
devin -p -- <prompt>
```

Primary non-interactive command for implementation from a trusted Claude delegation:

```bash
devin --permission-mode smart -p -- <prompt>
```

If Devin must edit files and run verification without stopping for approvals, and the user has explicitly granted fully trusted/unattended execution (or a previous Devin run failed asking for it), use:

```bash
devin --permission-mode dangerous -p -- <prompt>
```

`devin -p` runs a single-turn, no-REPL session, prints Devin's response to stdout, and exits. Use this for delegated agent runs from Claude Code. Avoid launching the interactive REPL unless a human explicitly wants to supervise it.

Interactive forms from the Devin docs:

```bash
devin                         # interactive REPL
devin -- your prompt here     # REPL with initial prompt
devin -p "prompt"             # single-turn stdout response
devin -p -- prompt words here # single-turn with -- separator
devin -c / devin --continue   # continue most recent session in current directory
devin -r / devin --resume     # pick from recent sessions
devin -r <session-id>         # resume a specific session
```

## Delegation contract

- Prefer the `devin-rescue` subagent when available. That subagent is a thin forwarding wrapper and should invoke Devin once.
- Use `devin -p -- <prompt>` for ordinary delegated tasks.
- Preserve the user's task intent. Strip only routing controls that are for Claude/Devin execution, not natural-language task content.
- If the prompt contains shell metacharacters, quotes, backticks, `$`, pipes, redirections, braces, or multiple lines, pass it through a safely quoted shell variable or heredoc rather than interpolating it into the command line.
- Return Devin's stdout faithfully. Do not pretend Devin succeeded if the CLI is missing, not logged in, or exits with an error.
- After Devin makes or proposes changes, Claude must inspect/verify before claiming the task is complete.

Safe heredoc pattern:

```bash
prompt=$(cat <<'DEVIN_TASK_EOF'
<verbatim delegated task>
DEVIN_TASK_EOF
)
devin -p -- "$prompt"
```

## Permission and mode guidance

Current Devin CLI permission flag:

```bash
--permission-mode <auto|accept-edits|smart|dangerous>
```

Equivalent environment variable:

```bash
DEVIN_PERMISSION_MODE=auto|accept-edits|smart|dangerous
```

Permission modes:

- `auto` (default): auto-approves read-only tools only. Good for investigation, review, and planning. Non-interactive implementation will often block here.
- `accept-edits`: also auto-approves workspace edits. It may still block on shell commands/tests or other non-edit tools.
- `smart`: additionally auto-runs actions a fast model judges safe. Prefer this for ordinary trusted implementation delegations when you want progress without blanket approval.
- `dangerous`: auto-approves all tools. Use only for explicitly trusted/unattended runs or when Devin reports that non-interactive mode requires it for the requested mutating task.

Other relevant flags:

- `--sandbox`: sandbox exec-tool processes. On Linux it uses bwrap+seccomp; writable roots come from granted `Write(...)` scopes and readable roots from granted `Read(...)` scopes. Combine with a non-`dangerous` permission mode when you want OS-enforced boundaries.
- `--model <MODEL>`: choose a model, e.g. `--model codex`, `--model opus`, or a full Devin model id.
- `--prompt-file <FILE>`: load the initial prompt from a file instead of shell quoting a large prompt.
- `--config <PATH>`: override `~/.config/devin/config.json`.
- `--agent-config <FILE>`: strict JSON/YAML agent config for system instructions, visible tools, and permissions.
- `--respect-workspace-trust`: in print mode this defaults to false; pass it explicitly when workspace trust should be enforced.

- Default to `auto`/normal CLI behavior for read-only work unless the user explicitly asks for more autonomy.
- For normal implementation handoffs, prefer `--permission-mode smart`; if this still blocks, rerun only with a stronger mode when the user has granted that trust or Devin's error explicitly requests it.
- Use `/plan` or plan-mode only for planning, not implementation.
- Use `/ask <question>` only for questions that should not change code.
- Legacy names in older notes map roughly as: Normal → `auto`, Accept Edits → `accept-edits`, Bypass → `dangerous`. Do not use stale flags like `--bypass`; use `--permission-mode dangerous`.

Relevant interactive slash commands from Devin:

- `/login`, `/logout`, `/update` for account/system setup.
- `/mode`, `/normal`, `/plan`, `/ask`, `/bypass` for interactive mode switching. For non-interactive `devin -p`, use `--permission-mode ...` on the command line instead.
- `/ls`, `/ls --all`, `/resume <id>`, `/continue`, `/rm-session <id>` for session management.
- `/workspace`, `/add-dir <path>`, `/undo-add-dir <path>` for workspace scope.
- `/loop <prompt>` runs a prompt and auto-reviews the diff in a loop; requires a clean git state. Use only when the user explicitly asks for an iterative Devin loop.

## When to use Devin from Claude

Good fits:

- The user explicitly asks for Devin or SWE-1.6.
- A focused implementation/debugging pass can be delegated and independently verified.
- Shell-heavy local investigation is useful and the result can be checked by Claude.
- Claude wants a second implementation perspective without spending premium judgement-model tokens.

Poor fits:

- Tiny edits Claude can make faster directly.
- High-stakes architecture, security, or product judgement without Claude-led review.
- Broad multi-agent audits; use `omegacode` for deterministic fan-out instead.
- Tasks where the user has not granted enough trust for Devin's requested permissions.
