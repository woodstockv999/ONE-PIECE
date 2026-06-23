import type { QuizResponse } from "./types";

// Gemini API が利用不可のときに返すデバッグ用ダミーデータ。
// 最新アーク（エルバフ編・第1180話前後）の実際の展開に基づく。
const DUMMY_LATEST: QuizResponse = {
  questions: [
    {
      q: "第1185話「ほっときなはれ」でブルックの回想に登場した人物は誰か？",
      options: ["キャンデル", "エルバフの戦士ハロルド", "ウリー・ルーヴェン", "ドゥシー"],
      answer: 2,
      explanation:
        "ブルックの回想では、かつて仲間だったウリー・ルーヴェンが登場し、エスペリア王国での若き日の出来事が描かれた。",
      difficulty: "中級",
      category: "ストーリー・エピソード",
    },
    {
      q: "エルバフ編でルフィ達が到達した島「エルバフ」はどんな種族が住む島か？",
      options: ["魚人族", "巨人族", "天竜人", "半魚人"],
      answer: 1,
      explanation:
        "エルバフは北欧神話をモチーフにした巨人族の島。ドリーとブロギーがかつて決闘していた聖地でもある。",
      difficulty: "初級",
      category: "世界観・地理",
    },
    {
      q: "エルバフ編に登場したエイジルの懸賞金は？",
      options: ["30億ベリー", "15億ベリー", "50億ベリー", "不明（未設定）"],
      answer: 3,
      explanation:
        "エイジルの正式な懸賞金は作中でまだ明示されておらず「不明」が正解。エルバフ最強の戦士として描かれている。",
      difficulty: "超難問",
      category: "懸賞金",
    },
  ],
};

export function getDummyLatestQuiz(count: number): QuizResponse {
  const questions = DUMMY_LATEST.questions.slice(0, Math.min(count, DUMMY_LATEST.questions.length));
  return { questions };
}
