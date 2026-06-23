#!/usr/bin/env bash
# ONE PIECE クイズ（app2）を VPS に「アプリとして配置」する冪等スクリプト。
#
# 役割:
#   - リポジトリを取得/更新し、basePath=/onepiece でビルド
#   - PM2 で :3001 常駐（既存なら再起動）
#   - ポータル(index.html)を /var/www/portal に配置（sudo）
#   - Nginx をポータル構成（/ , /marumie→3000 , /onepiece→3001）に設定
#     ※ nginx 操作のみ sudo が必要。それ以外は一般ユーザーで実行可能。
#
# 使い方（W00dst0ck ユーザーで実行）:
#   [推奨] claude login 済みであれば API キー不要:
#     bash deploy/deploy.sh
#   [代替] Anthropic API キーを使う場合:
#     ANTHROPIC_API_KEY=sk-ant-... bash deploy/deploy.sh
#
# 上書き/変更可能な環境変数:
#   APP_DIR    (default ~/apps/one-piece)
#   PORT       (default 3001)
#   BASE_PATH  (default /onepiece)
#   APP_NAME   (default onepiece)
#   REPO_URL, BRANCH (default main)
#   NGINX_CONF (default ~/etc/nginx-onepiece.conf — sudo でコピー先を指定)

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/one-piece}"
PORT="${PORT:-3001}"
BASE_PATH="${BASE_PATH:-/onepiece}"
APP_NAME="${APP_NAME:-onepiece}"
REPO_URL="${REPO_URL:-https://github.com/woodstockv999/ONE-PIECE.git}"
BRANCH="${BRANCH:-main}"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

# --- 前提コマンド確認 ---
for c in git node npm; do
  command -v "$c" >/dev/null 2>&1 || { echo "ERROR: '$c' が見つかりません。先に導入してください。"; exit 1; }
done
command -v pm2 >/dev/null 2>&1 || { log "pm2 を導入 (--prefix ~/.local)"; npm install -g pm2 --prefix ~/.local; export PATH="$HOME/.local/bin:$PATH"; }

# --- コード取得 / 更新 ---
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  log "既存リポジトリを更新: $APP_DIR"
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  log "リポジトリを取得: $REPO_URL"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# --- 認証確認 ---
# claude CLI の OAuth トークンが ~/.claude/.credentials.json にあれば API キー不要。
# なければ ANTHROPIC_API_KEY を .env.local に書き込む。
if [ -f "$HOME/.claude/.credentials.json" ]; then
  log "claude CLI のサブスク認証を使用します（API キー不要）"
  # .env.local が無ければ空ファイルを作成（Next.js が要求するため）
  touch .env.local
else
  if [ ! -f .env.local ]; then
    if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
      log ".env.local を作成（ANTHROPIC_API_KEY を書き込み）"
      printf 'ANTHROPIC_API_KEY=%s\n' "$ANTHROPIC_API_KEY" > .env.local
    else
      log "警告: claude CLI 未ログイン・ANTHROPIC_API_KEY も未設定。例ファイルから作成します"
      cp .env.local.example .env.local
      echo "  → 'claude login' を実行するか $APP_DIR/.env.local に API キーを設定してください。"
    fi
  else
    log ".env.local は既存のため尊重（上書きしません）"
  fi
fi

# --- 依存 & ビルド ---
log "依存をインストール (npm ci)"
npm ci
log "ビルド (basePath=$BASE_PATH)"
NEXT_PUBLIC_BASE_PATH="$BASE_PATH" npm run build

# --- PM2 で :$PORT 常駐 ---
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "PM2 プロセスを再起動: $APP_NAME (PORT=$PORT)"
  PORT="$PORT" pm2 restart "$APP_NAME" --update-env
else
  log "PM2 プロセスを起動: $APP_NAME (PORT=$PORT)"
  PORT="$PORT" pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save

# --- ポータル配置（/var/www/portal に固定） ---
log "ポータルを配置: /var/www/portal"
sudo mkdir -p /var/www/portal
sudo cp "$APP_DIR/deploy/portal/index.html" /var/www/portal/index.html

# --- Nginx 設定（sudo が必要な部分のみ） ---
log "Nginx 設定を適用 (sudo が必要)"
# nginx.conf は /var/www/portal を実パスとして直接使うため sed 置換不要
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/portal
sudo ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/onepiece
sudo nginx -t
sudo systemctl reload nginx

log "完了: http://210.131.212.62/onepiece で確認してください（ポータルは / ）"
