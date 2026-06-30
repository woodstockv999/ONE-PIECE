#!/usr/bin/env bash
# 共有デプロイスクリプト（onepiece / briefing-bot / marumie-jp から呼ばれる）
# 各アプリの deploy/update-check.sh が exec で委譲してくる。
#
# 使い方:
#   auto-deploy.sh <app_name> <app_dir> <pm2_name> <build_cmd> <health_url>
#
# 通常は origin/main の HEAD が変わっていなければ何もしない。
# FORCE=true を付けると、変更がなくても強制的に再ビルド・再起動する
#   （例: git push 直後の手動デプロイ）。

set -uo pipefail

APP_NAME="$1"
APP_DIR="$2"
PM2_NAME="$3"
BUILD_CMD="$4"
HEALTH_URL="$5"

BRANCH="main"
LOCK_FILE="/tmp/${APP_NAME}-update.lock"
LOG_FILE="$HOME/logs/${APP_NAME}-update.log"
NOTIFY_EMAIL="jsbseven170@gmail.com"

mkdir -p "$HOME/logs"

send_mail() {
  local subject="$1"
  local body="$2"
  printf "Subject: %s\nFrom: %s\nTo: %s\nContent-Type: text/plain; charset=UTF-8\n\n%s\n" \
    "$subject" "$NOTIFY_EMAIL" "$NOTIFY_EMAIL" "$body" \
    | msmtp "$NOTIFY_EMAIL" 2>>"$LOG_FILE" || true
}

# 多重実行防止
if [ -f "$LOCK_FILE" ]; then
  echo "[$(date '+%F %T')] 既に実行中のため終了" >> "$LOG_FILE"
  exit 0
fi
touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

cd "$APP_DIR" || { echo "[$(date '+%F %T')] ERROR: $APP_DIR が見つかりません" >> "$LOG_FILE"; exit 1; }

if ! git fetch origin "$BRANCH" --quiet 2>>"$LOG_FILE"; then
  echo "[$(date '+%F %T')] ERROR: git fetch 失敗" >> "$LOG_FILE"
  exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ] && [ "${FORCE:-false}" != "true" ]; then
  # 更新なし（正常系）：ログには出力しない
  exit 0
fi

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[$(date '+%F %T')] FORCE=true: 変更なしだが強制デプロイ (${LOCAL:0:7})" >> "$LOG_FILE"
else
  echo "[$(date '+%F %T')] 新しいコミット検出: ${LOCAL:0:7} -> ${REMOTE:0:7}" >> "$LOG_FILE"
fi
echo "[$(date '+%F %T')] デプロイ開始..." >> "$LOG_FILE"

{
  git reset --hard "origin/$BRANCH" && \
  eval "$BUILD_CMD" && \
  pm2 restart "$PM2_NAME" --update-env && \
  pm2 save
} >> "$LOG_FILE" 2>&1
DEPLOY_STATUS=$?

if [ "$DEPLOY_STATUS" -eq 0 ]; then
  echo "[$(date '+%F %T')] デプロイ完了" >> "$LOG_FILE"
  sleep 3
  if curl -sf -o /dev/null "$HEALTH_URL"; then
    echo "[$(date '+%F %T')] ヘルスチェック OK: $HEALTH_URL" >> "$LOG_FILE"
  else
    echo "[$(date '+%F %T')] WARN: ヘルスチェック失敗: $HEALTH_URL" >> "$LOG_FILE"
  fi
  send_mail "[$APP_NAME] デプロイ完了 ✅" "$(printf '%s -> %s がデプロイされました。\n\n時刻: %s\nURL: %s' "${LOCAL:0:7}" "${REMOTE:0:7}" "$(date '+%F %T')" "$HEALTH_URL")"
else
  echo "[$(date '+%F %T')] ERROR: デプロイ失敗（ログを確認してください）" >> "$LOG_FILE"
  send_mail "[$APP_NAME] デプロイ失敗 ❌" "$(printf '%s -> %s のデプロイに失敗しました。\n\n時刻: %s\nログ: %s' "${LOCAL:0:7}" "${REMOTE:0:7}" "$(date '+%F %T')" "$LOG_FILE")"
  exit 1
fi
