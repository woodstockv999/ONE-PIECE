# ONE PIECE Quiz App

> ワンピースの知識をどこまで試せますか？AI が生成する本格的な 4 択クイズで腕試しを。

## 概要

AI（Gemini / Claude）が動的に生成する ONE PIECE クイズアプリです。
カテゴリと難易度を自由に組み合わせて出題でき、スコアボードで自分の成長も確認できます。
初心者からコアファンまで楽しめる幅広い問題設計が特徴です。

## 機能

- **4 段階の難易度**
  - 初級：主要キャラ・基本設定・有名な悪魔の実
  - 中級：各編の展開・懸賞金・覇気の詳細
  - 上級：マイナーキャラ・地名・組織の細部・伏線
  - 超難問：SBS・扉絵連載・コアファン向け小ネタ
- **9 種類のカテゴリ**: キャラクター / 悪魔の実 / 懸賞金 / 能力・技・覇気 / ストーリー / 組織・勢力 / 世界観・地理 / 名言・名シーン / 総合ミックス
- **AI 生成問題**: 毎回異なる問題を動的生成、ネタバレ問題になりにくい
- **採点モード選択**: 1 問ずつ即時採点 or 全問解答後まとめて採点
- **スコアボード & 履歴**: 過去の成績をローカルに保存して振り返れる
- **解説表示**: 不正解でもしっかり学べる詳細な解説付き

## 技術スタック

| 役割 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| AI | Gemini 2.5 Flash / Claude Haiku |
| スタイル | Tailwind CSS |
| 状態管理 | localStorage |

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/woodstockv999/ONE-PIECE.git
cd ONE-PIECE

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local に API キーを記入

# 開発サーバーを起動
npm run dev
```

## 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `ANTHROPIC_API_KEY` | （オプション）claude CLI の OAuth トークンが無い/期限切れの場合のフォールバック |

## スクリプト

```bash
npm run dev    # 開発サーバー起動 (http://localhost:3000)
npm run build  # 本番ビルド
npm run start  # 本番サーバー起動
npm run lint   # ESLint チェック
```

## ライセンス

MIT
