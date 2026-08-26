#!/bin/bash
# Robust git commit for Windows bash via Jcode.
# Usage: _commit.sh <msgfile> [file1 file2 ...]
# Stages the listed files (or everything if none given) and commits with --file.
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
if [ "$# -ge 2" ]; then
  shift
  git add "$@"
else
  git add -A
fi
git commit --file="$1"
echo "exit=$?"
