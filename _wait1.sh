#!/bin/bash
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
for i in $(seq 1 60); do
  if git log --oneline -1 | grep -q "cast roster"; then
    echo "COMMIT_FOUND"
    git log --oneline -1
    break
  fi
  if [ -f /mnt/c/Users/TAUSHEF/Downloads/int/.superpowers/sdd/task-1-report.md ]; then
    echo "REPORT_FOUND"
    break
  fi
  sleep 5
done
echo "done polling"
