#!/bin/bash
SKILL=/mnt/c/Users/TAUSHEF/.claude/plugins/cache/superpowers-dev/superpowers/6.1.1/skills/subagent-driven-development
for f in task-brief review-package sdd-workspace; do
  sed -i 's/\r$//' "$SKILL/scripts/$f"
  echo "stripped CR from $f"
done
echo "done"
