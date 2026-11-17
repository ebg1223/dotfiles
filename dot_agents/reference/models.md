# Models

The one table of delegate models. `work`, `architect`, `review-loop`, and project skills point here. Change a model here and nowhere else.

A review round uses one reviewer. The second reviewer runs only after round 1 finds a critical issue.

| Role | T3 target | Second reviewer, only after a critical finding | Plain Claude Code |
|---|---|---|---|
| pre-planned implementation, detailed+specific plan provided | `opencode/openai/gpt-6.1-terra-fast` effort=max | | `opus`, effort medium |
| implementation, cross-cutting or concurrent | `opencode/claude-agent/opus` effort=high | | `opus`, effort high |
| difficult or very complex implementation | `opencode/claude-agent/opus` effort=xhigh | | `opus`, effort xhigh |
| research, read-only | `codex/gpt-6.1-terra` reasoningEffort=max serviceTier=priority | | `opus` |
| review of code GPT wrote | `opencode/claude-agent/opus` effort=xhigh | `pi/digitalocean/deepseek-v4.1-flash-1017` reasoningEffort=max | `opus` |
| review of code Claude wrote | `opencode/openai/gpt-6.1-terra-fast` reasoningEffort=max | `grok/grok-4.7` reasoningEffort=max | `fable` |
| architect candidates | one `claude/claude-fable-5-2` effort=high, one `codex/gpt-6-astra` reasoningEffort=xhigh | | `opus` and `fable` |
| independent live tester | `codex` reasoningEffort=high | | a fresh `delegate` on another family when available |
