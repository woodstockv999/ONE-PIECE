#!/usr/bin/env bash
# PostToolUse hook: 編集ファイルを git add して repo パスを記録するだけ

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

[ -z "$FILE" ] && exit 0
[ ! -f "$FILE" ] && exit 0

GIT_ROOT=$(git -C "$(dirname "$FILE")" rev-parse --show-toplevel 2>/dev/null)
[ -z "$GIT_ROOT" ] && exit 0

cd "$GIT_ROOT" || exit 0
git add "$FILE"
echo "$GIT_ROOT" >> /tmp/claude-push-repos
