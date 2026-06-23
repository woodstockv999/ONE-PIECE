# 🏴‍☠️ ONE PIECE クイズアプリ

難易度を選んで挑戦する ONE PIECE の4択クイズ Web アプリです。**Claude（Anthropic API）が問題を生成**し、採点・解説・スコア記録・履歴をローカルに保存します。Next.js (App Router) + TypeScript + Tailwind CSS で実装され、**Vercel または VPS にデプロイして iPhone を含む任意のデバイスからブラウザでアクセス**できます。

> 個人利用・学習目的の **非公式ファンツール** です。ONE PIECE は集英社／尾田栄一郎氏の著作物です（→ [権利・コンプライアンス](#権利コンプライアンス)）。

---

## ✨ 主な機能

- **難易度別クイズ生成**：初級／中級／上級／超難問の4段階。難易度ごとに出題範囲・問われる細かさが変わります。
- **カテゴリ選択**：プリセット（キャラクター／悪魔の実／懸賞金 など）＋自由入力（「ワノ国編」など特定の編も指定可）。
- **問題数選択**：3 / 5 / 10 問。
- **採点・解説**：各問の正誤・正解・解説を表示。「最後にまとめて採点」（デフォルト）と「1問ずつ即時採点」を切替可能。
- **スコア記録**：ベスト正答率・最高連続正解・累計挑戦回数・難易度別正答率を localStorage に保存。
- **履歴**：過去の挑戦（出題・自分の回答・正解）を保存し、再表示・削除が可能。リロードしても残ります。
- **最新話モード（任意）**：知識カットオフ以降の最新の展開を Web 検索して出題（数十秒・ネタバレ注意）。
- **深掘り解説（任意）**：気になったカテゴリ・トピックを ONE PIECE の文脈で詳しく解説。

---

## ⚠️ 前提：Anthropic API キーとクレジットが必要

このアプリは `@anthropic-ai/sdk` 経由で **Anthropic API** を呼び出します。動作には次が必要です。

1. **Anthropic Console（[console.anthropic.com](https://console.anthropic.com)）のアカウント**
2. そこで発行した **API キー**
3. **プリペイド（従量課金）クレジット残高**

> **重要**：**Claude Pro / Max などのチャット用サブスクリプション契約だけでは API は利用できません。** チャット用プランと API Console は別製品・別課金です。「Console アカウント＋API キー＋クレジット残高」を用意してください。

API キーは **サーバー側（Next.js の API ルート）でのみ使用**され、ブラウザには一切露出しません。

---

## 🚀 セットアップ（ローカル）

```bash
# 1. 依存をインストール
npm install

# 2. 環境変数ファイルを用意
cp .env.local.example .env.local
#   .env.local を編集し、ANTHROPIC_API_KEY=sk-ant-... を設定

# 3. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 疎通確認（任意・curl）

```bash
curl -X POST http://localhost:3000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"初級","category":"キャラクター","count":3}'
```

第4-1節の JSON スキーマ（`questions[].q / options / answer / explanation / difficulty / category`）で返れば成功です。

---

## ☁️ Vercel へのデプロイ

1. このリポジトリを GitHub に push します。
2. [vercel.com](https://vercel.com) で **New Project** → 当該リポジトリを Import。
3. フレームワークは自動で **Next.js** が選択されます（追加設定不要）。
4. **Settings → Environment Variables** に `ANTHROPIC_API_KEY` を追加（Production / Preview / Development）。
5. **Deploy**。発行された公開 URL に iPhone を含む任意の端末からアクセスできます。

> 最新話モードの Web 検索は実行に時間がかかるため、API ルートに `maxDuration` を設定済みです（`quiz`=60秒 / `latest`=120秒）。プランによっては上限が異なるため、必要に応じて調整してください。

---

## 🖥️ VPS へのデプロイ（例：Ubuntu 24.04）

```bash
# Node.js 20 をインストール（未導入の場合）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# リポジトリを取得してビルド
git clone <このリポジトリ> one-piece && cd one-piece
npm ci
npm run build

# 環境変数を安全に設定（.env.local をコミットしない）
export ANTHROPIC_API_KEY="sk-ant-..."   # もしくは systemd の Environment= 等で管理
npm run start                            # 既定で :3000 で起動
```

本番運用では **PM2 や systemd でプロセス管理**し、**Nginx をリバースプロキシ**にして 80/443 を 3000 に転送する構成を推奨します。**API キーは `.env.local` をコミットせず、環境変数（systemd の `Environment=` / シークレット管理）で安全に設定**してください。

### ポータル配下にサブパス配信（推奨・複数アプリ構成）

複数アプリを 1 台の VPS にぶら下げる構成（`/` ポータル、`/onepiece` 本アプリ:3001、`/briefing` 別アプリ:3000 …）に対応しています。本アプリは `basePath=/onepiece`（環境変数 `NEXT_PUBLIC_BASE_PATH` で変更可）でビルドされます。

VPS 上（root）でワンコマンド配置（取得→ビルド→PM2:3001→ポータル設置→Nginx 設定）:

```bash
ANTHROPIC_API_KEY=sk-ant-... bash deploy/deploy.sh
```

- ポータル本体: `deploy/portal/index.html`
- Nginx 構成: `deploy/nginx.conf`（`/`→ポータル / `/briefing`→:3000 / `/onepiece`→:3001）
- 別アプリ（briefing 等）も、それぞれ自分の basePath に合わせる必要があります。


<details>
<summary>systemd ユニット例</summary>

```ini
# /etc/systemd/system/onepiece-quiz.service
[Unit]
Description=ONE PIECE Quiz
After=network.target

[Service]
WorkingDirectory=/opt/one-piece
ExecStart=/usr/bin/npm run start
Environment=NODE_ENV=production
Environment=ANTHROPIC_API_KEY=sk-ant-...
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```
</details>

---

## 🧱 技術スタック

| 項目 | 採用 |
| --- | --- |
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| スタイリング | Tailwind CSS |
| AI | Anthropic API（`@anthropic-ai/sdk`） |
| モデル | `claude-sonnet-4-6`（正答精度を優先） |
| Web 検索 | 原則オフ。最新話モードのみ `web_search_20250305` を使用 |
| 状態保存 | localStorage（履歴・設定・スコア） |

---

## 📁 ディレクトリ構成

```
app/
  page.tsx                 # メイン画面（選択 → 進行 → 結果）
  layout.tsx               # ルートレイアウト
  globals.css              # Tailwind + 最小スタイル
  api/
    quiz/route.ts          # クイズ生成（通常・JSON）
    latest/route.ts        # 最新話モード（Web検索）
    explain/route.ts       # 深掘り解説
  components/
    DifficultyPicker.tsx   # 難易度選択
    CategoryPicker.tsx     # カテゴリ選択（プリセット＋自由入力）
    QuizPlayer.tsx         # 出題・回答受付（即時/まとめて採点）
    ResultView.tsx         # 採点・解説・見直し・深掘り・誤り報告
    ScoreBoard.tsx         # ベスト記録
    HistorySidebar.tsx     # 履歴の一覧・再表示・削除
    ExplainButton.tsx      # 深掘り解説ボタン
lib/
  types.ts                 # 型定義
  prompts.ts               # 難易度別プロンプト組み立て
  storage.ts               # localStorage ラッパー
  parse.ts                 # レスポンス抽出・JSON安全パース
  apiError.ts              # APIエラー → ユーザー向けメッセージ変換
.env.local.example
```

---

## 🛡️ ハルシネーション（事実誤り）対策

AI 生成クイズ最大のリスク「正解とされた選択肢が実は誤り」に対し、本アプリは以下を実装しています。

- **(B) プロンプトでの自己検証**：「確実な事実のみ出題」「曖昧なら出題しない」「正解の根拠を内部で確認」をプロンプトで指示。
- **(C) モデル固定**：全難易度で `claude-sonnet-4-6` を使用（低コストだが高難易度でマイナー設定を取り違えやすい `claude-haiku-4-5` は不採用）。
- **(D) フィードバック導線＋免責表示**：結果画面に「AI 生成のため誤りを含む可能性があります」を明示し、各問に「誤りを報告」ボタンを設置。

> 高難易度のみ Web 検索で裏取りする選択肢 (A) は、コア機能（通常モード）を高速・低コストに保つため既定では採用していません。最新話モードで検索を使う基盤は実装済みのため、必要であれば上級・超難問に拡張できます。

---

## 🧪 エラーハンドリング

API キー未設定・無効、クレジット不足、通信失敗、JSON パース失敗のいずれでも、ユーザーに分かる日本語メッセージを表示します（`lib/apiError.ts`）。

---

## 権利・コンプライアンス

- ONE PIECE は **集英社／尾田栄一郎氏** の著作物です。本アプリは **個人利用・学習目的** を前提とします。
- 出題は **事実ベースの知識クイズ** に限定し、原作の画像・ロゴ・長文台詞の逐語転載は行いません。公式名称・ロゴ・キャラクター画像を装飾に使用していません。
- **第三者へ公開・配布・商用利用する場合は、別途権利関係の確認が必要** です。

---

## スコープ外

ユーザー認証・複数ユーザー対応、外部 DB、オンライン対戦・ランキング共有、課金・利用量制限 UI、原作画像の表示は対象外です。
