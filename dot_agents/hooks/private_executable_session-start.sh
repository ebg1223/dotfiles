#!/bin/sh
# Injects the stack routing note at session start and after compaction.
# Registered in ~/.claude/settings.json under hooks.SessionStart.
# Touch ~/.agents/hooks/off to silence it.
set -eu
dir=$(dirname "$0")
[ -f "$dir/off" ] && exit 0
cat "$dir/session-start-context.md"
