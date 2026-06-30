#!/usr/bin/env bash
# Stop hook: ターン終了時に staged 変更を一括 commit & push し、開発日誌への記録を促す。
# 記録条件は3種類を統合: (1) git push (2) git管理外ファイルの編集 (3) インフラ系Bashコマンド
# → いずれも /tmp/claude-diary-activity に集約される（git push分はこのスクリプトが追記）。

REPOS_FILE="/tmp/claude-push-repos"
ACTIVITY_FILE="/tmp/claude-diary-activity"

if [ -f "$REPOS_FILE" ]; then
  sort -u "$REPOS_FILE" | while read -r repo; do
    [ -z "$repo" ] && continue
    cd "$repo" || continue
    git diff --cached --quiet && continue
    FILES=$(git diff --cached --name-only | tr '\n' ' ' | sed 's/ $//')
    git commit -m "auto: update $FILES"
    git push origin main 2>/dev/null || git push origin HEAD 2>/dev/null
    git pull origin main 2>/dev/null || true
    echo "[push] $(basename "$repo"): ${FILES}" >> "$ACTIVITY_FILE"
  done
  rm -f "$REPOS_FILE"
fi

# 今回のターンに記録すべき活動（push／git管理外編集／インフラ操作）があれば、停止前に一度だけ確認を促す
if [ -s "$ACTIVITY_FILE" ]; then
  ACTIVITY_LIST=$(cat "$ACTIVITY_FILE")
  rm -f "$ACTIVITY_FILE"
  REASON=$(cat <<EOF
今回のターンで以下の作業がありました:
${ACTIVITY_LIST}

開発日誌（diary アプリ）にまだ記録されていません。応答を終了する前に、意味のある作業ごとに2〜4行程度の日本語（具体的に。汎用的な文言は不可）で要約し、次のコマンドで記録してください:

curl -s -X POST http://127.0.0.1:3009/diary/api/entries -H "Content-Type: application/json" -d '{"app":"<アプリ名 or general>","content":"<要約>","author":"claude"}'

確認・調査のみで実質的な変更を伴わない場合は、記録せずそのまま終了してよい。記録が完了 or 不要と判断したら、通常どおり応答を終了してください。
EOF
)
  jq -n --arg reason "$REASON" '{decision: "block", reason: $reason}'
  exit 0
fi
