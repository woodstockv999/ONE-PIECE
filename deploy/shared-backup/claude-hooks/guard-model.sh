#!/usr/bin/env bash
# PreToolUse hook (Edit / Write): claude-sonnet モデル文字列のコード書き込みをブロック
# 理由: OAuth トークン競合で即 429 になるため全アプリで禁止

INPUT=$(cat)

# Edit の new_string か Write の content を取得
CONTENT=$(echo "$INPUT" | jq -r '(.new_string // .content // "")' 2>/dev/null)

if echo "$CONTENT" | grep -q "claude-sonnet"; then
  printf "❌ BLOCKED: 'claude-sonnet' はアプリコードに使用禁止です（OAuth トークン競合 → 429）。\n" >&2
  printf "代替モデル:\n" >&2
  printf "  通常の API 呼び出し: claude-haiku-4-5-20251001\n" >&2
  printf "  ウェブ検索が必要:    gemini-2.5-flash\n" >&2
  exit 2
fi

exit 0
