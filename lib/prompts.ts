import type { Difficulty } from "./types";

// 難易度ごとの出題範囲・問われる細かさ
const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  初級:
    "誰でも知っている主要キャラ・基本設定・有名な悪魔の実。原作未読でも常識的に解けるレベル。",
  中級:
    "各編（アーク）の展開・主要キャラの懸賞金・覇気の種類・能力の詳細など、読んでいれば解けるレベル。",
  上級:
    "マイナーキャラ・地名・組織の細部・過去編や伏線に踏み込む、ファン向けレベル。",
  超難問:
    "SBSコーナーの設定・扉絵連載・細かい数値や誕生日・小ネタなど、コアファン向けレベル。",
};

/**
 * 通常モード（Web検索なし）のクイズ生成プロンプト。
 * トークン節約のため簡潔に。JSONのみを厳命し、自己検証を指示（ハルシネーション対策B）。
 */
export function buildQuizPrompt(
  difficulty: Difficulty,
  category: string,
  count: number,
  seenQuestions: string[] = [],
): string {
  const seenSection =
    seenQuestions.length > 0
      ? `\n# 【絶対禁止】既出問題リスト\n以下は過去に出題済みの問題文です。\n- これらと「全く同じ問題」は絶対に出題しない。\n- これらと「同じ知識を問う問題」（言い回しを変えても正解が同じになる問題）も絶対に出題しない。\n- 出題前に各問を必ずこのリストと照合すること。\n${seenQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

  return `あなたは漫画「ONE PIECE」（尾田栄一郎・集英社）に精通したクイズ作成者です。
以下の条件で4択クイズを${count}問作成してください。

# 条件
- 難易度: ${difficulty}（${DIFFICULTY_GUIDE[difficulty]}）
- カテゴリ: ${category}
- 各問は4つの選択肢を持ち、正解はちょうど1つ。
- 選択肢は紛らわしく、かつ事実として明確に判定できるものにする。
- まだ上記リストにない、新しい切り口の問題を選ぶこと。${seenSection}

# 正確性（最重要）
- 確実な事実のみを出題すること。少しでも曖昧・うろ覚えの設定は出題しない。
- 各設問について、正解の根拠を内部で必ず確認してから出題すること。
- 原作の長いセリフの逐語転載はしない（名言系も短い言及にとどめる）。

# 出力形式（厳守）
- JSONのみを出力する。前置き・説明・Markdownのコードフェンス（\`\`\`）を一切付けない。
- スキーマ:
{
  "questions": [
    {
      "q": "問題文",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "answer": 0,
      "explanation": "なぜその答えになるかの解説（1〜3文）",
      "difficulty": "${difficulty}",
      "category": "${category}"
    }
  ]
}
- "answer" は正解選択肢のインデックス（0始まり、0〜3）。
- "options" は必ず4要素。`;
}

/**
 * 最新話モード用プロンプト（Gemini + Google Search grounding で使用）。
 * Gemini が自身で検索して最新情報を取得し、そのままクイズを生成する。
 */
export function buildLatestQuizPrompt(
  difficulty: Difficulty,
  category: string,
  count: number,
  seenQuestions: string[] = [],
): string {
  const seenSection =
    seenQuestions.length > 0
      ? `\n# 【絶対禁止】既出問題リスト\n以下は過去に出題済みの問題文です。\n- これらと「全く同じ問題」は絶対に出題しない。\n- これらと「同じ知識を問う問題」（言い回しを変えても正解が同じになる問題）も絶対に出題しない。\n- 出題前に各問を必ずこのリストと照合すること。\n${seenQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `あなたは漫画「ONE PIECE」（尾田栄一郎・集英社）に精通したクイズ作成者です。
今日は${today}です。Google検索ツールを使い、ONE PIECEの最新話・直近の展開（エルバフ編など）に関する情報を調べたうえで、4択クイズを${count}問作成してください。

# 条件
- 難易度: ${difficulty}（${DIFFICULTY_GUIDE[difficulty]}）
- カテゴリ: ${category}
- 直近の連載（最新話・最新アーク）の内容を中心に出題する。
- 各問は4つの選択肢を持ち、正解はちょうど1つ。${seenSection}

# 正確性（最重要）
- 検索で裏付けが取れた確実な事実のみを出題すること。
- 曖昧な情報や憶測は出題しない。
- 原作の長いセリフの逐語転載はしない。

# 出力形式（絶対厳守）
- JSONのみを出力する。前置き・説明・Markdownのコードフェンス（\`\`\`）を一切付けない。
- スキーマ:
{
  "questions": [
    {
      "q": "問題文",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "answer": 0,
      "explanation": "なぜその答えになるかの解説（1〜3文）",
      "difficulty": "${difficulty}",
      "category": "${category}"
    }
  ]
}
- "answer" は正解選択肢のインデックス（0始まり、0〜3）。
- "options" は必ず4要素。`;
}

/**
 * 深掘り・解説モードのプロンプト。
 */
export function buildExplainPrompt(topic: string): string {
  return `漫画「ONE PIECE」（尾田栄一郎・集英社）の文脈で、次のキーワード/トピックについて、
ファン向けにわかりやすく詳しく解説してください。

トピック: 「${topic}」

# 条件
- 事実ベースで、確実な情報のみを述べる。曖昧な点は「諸説ある」「作中で明言されていない」と明記する。
- 原作の長いセリフの逐語転載はしない。
- Markdown形式で、見出しや箇条書きを使って読みやすく。300〜500字程度。`;
}

// 問題数に応じた max_tokens の目安（トークン節約）。1問あたり約400トークン + バッファ。
export function maxTokensForCount(count: number): number {
  return Math.min(400 * count + 512, 4096);
}
