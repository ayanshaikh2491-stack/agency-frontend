#!/bin/bash
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
echo "=== diff stat vs parent ==="
git show --stat --oneline 2f64c91 | cat
echo "=== files changed in this commit ==="
git diff-tree --no-commit-id --name-only -r 2f64c91 | cat
echo "=== verify cast.js is only tracked change beyond pre-existing ==="
git status --short | grep "cast.js" | cat
