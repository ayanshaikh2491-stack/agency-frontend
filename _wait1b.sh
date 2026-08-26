#!/bin/bash
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
for i in $(seq 1 60); do
  cur=$(git log --oneline -1 | cat)
  if echo "$cur" | grep -q "cast roster"; then
    echo "COMMIT_FOUND: $cur"
    break
  fi
  sleep 5
done
echo "--- current HEAD ---"
git log --oneline -1 | cat
echo "--- cast.js tracked? ---"
git status --short src/app/admin/office/cast.js | cat
