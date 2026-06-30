#!/usr/bin/env bash
# Stop hook: ターン終了時に staged 変更を一括 commit & push し、開発日誌への記録を促す

REPOS_FILE="/tmp/claude-push-repos"
DIARY_PENDING="/tmp/claude-diary-pending"

if [ -f "$REPOS_FILE" ]; then
  sort -u "$REPOS_FILE" | while read -r repo; do
    [ -z "$repo" ] && continue
    cd "$repo" || continue
    git diff --cached --quiet && continue
    FILES=$(git diff --cached --name-only | tr '\n' ' ' | sed 's/ $//')
    git commit -m "auto: update $FILES"
    git push origin main 2>/dev/null || git push origin HEAD 2>/dev/null
    git pull origin main 2>/dev/null || true
    echo "$(basename "$repo"): ${FILES}" >> "$DIARY_PENDING"
  done
  rm -f "$REPOS_FILE"
fi

# 今回 push したアプリがあれば、停止前に開発日誌への記録を一度だけ強制する
if [ -s "$DIARY_PENDING" ]; then
  PENDING_LIST=$(cat "$DIARY_PENDING")
  rm -f "$DIARY_PENDING"
  REASON=$(cat <<EOF
今回のターンで以下のアプリに変更を push しました:
${PENDING_LIST}

開発日誌（diary アプリ）にまだ記録されていません。応答を終了する前に、アプリごとに今回の変更内容を2〜4行程度の日本語（具体的に。汎用的な文言は不可）で要約し、次のコマンドで記録してください:

curl -s -X POST http://127.0.0.1:3009/diary/api/entries -H "Content-Type: application/json" -d '{"app":"<アプリ名>","content":"<要約>","author":"claude"}'

記録が完了したら、通常どおり応答を終了してください。
EOF
)
  jq -n --arg reason "$REASON" '{decision: "block", reason: $reason}'
  exit 0
fi
