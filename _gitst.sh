#!/bin/bash
cd /mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend
echo "status:" > /tmp/gitst.log
git status --short >> /tmp/gitst.log 2>&1
echo "--- branch ---" >> /tmp/gitst.log
git branch --show-current >> /tmp/gitst.log 2>&1
cat /tmp/gitst.log
