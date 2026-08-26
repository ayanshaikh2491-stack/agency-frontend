#!/bin/bash
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
npx tsc --noEmit -p tsconfig.json > /tmp/tsc1.log 2>&1
echo "exit=$?"
echo "--- last 15 lines of tsc log ---"
tail -n 15 /tmp/tsc1.log
