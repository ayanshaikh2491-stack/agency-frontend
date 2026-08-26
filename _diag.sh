#!/bin/bash
SKILL=/mnt/c/Users/TAUSHEF/.claude/plugins/cache/superpowers-dev/superpowers/6.1.1/skills/subagent-driven-development
echo "bash path: $(command -v bash)"
echo "bash version: $BASH_VERSION"
echo "--- task-brief first bytes ---"
od -c "$SKILL/scripts/task-brief" | head -3
echo "--- does it have CR? ---"
grep -c $'\r' "$SKILL/scripts/task-brief" || echo "no grep"
