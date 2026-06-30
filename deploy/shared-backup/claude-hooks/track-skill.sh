#!/usr/bin/env bash
# PostToolUse hook: Skill ツール呼び出し時にダッシュボードへ使用回数を記録

INPUT=$(cat)
SKILL=$(echo "$INPUT" | jq -r '.tool_input.skill // empty' 2>/dev/null)

[ -z "$SKILL" ] && exit 0

# プラグイン名前空間を除去 (e.g. "foo@plugin-ns" → "foo")
SKILL="${SKILL%%@*}"

curl -s -X POST "http://localhost:3005/api/track?agent=${SKILL}" > /dev/null 2>&1 || true
