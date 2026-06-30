#!/usr/bin/env bash
# PostToolUse hook (Bash): インフラ・運用に影響するコマンドだけを日誌用の活動ログに記録する。
# 読み取り専用コマンド（ls/cat/grep/curl GETなど）は無視してノイズを抑える。

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$CMD" ] && exit 0

if echo "$CMD" | grep -qE \
  'pm2 (restart|start|stop|delete|save)|systemctl (restart|reload|start|stop)|crontab |gh repo (create|delete)|nginx[^|]*-s reload|apt(-get)? install|ufw |useradd|usermod|git (push|commit)|mkdir -p /etc|rm -rf'; then
  SHORT=$(echo "$CMD" | head -c 200 | tr '\n' ' ')
  echo "[bash] $SHORT" >> /tmp/claude-diary-activity
fi