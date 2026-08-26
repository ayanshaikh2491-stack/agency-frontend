#!/bin/bash
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
npm run lint > /tmp/lint.log 2>&1
echo "exit=$?"
tail -n 25 /tmp/lint.log
