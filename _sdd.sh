sdd_run() {
  local SKILL=/mnt/c/Users/TAUSHEF/.claude/plugins/cache/superpowers-dev/superpowers/6.1.1/skills/subagent-driven-development
  local PLAN=/mnt/c/Users/TAUSHEF/Downloads/int/agency-frontend/docs/superpowers/plans/2026-08-20-munder-flavored-office.md
  "$SKILL/scripts/task-brief" "$PLAN" "$1"
}
sdd_run "$1"
