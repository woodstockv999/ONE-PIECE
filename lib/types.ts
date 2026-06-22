// ONE PIECE クイズアプリの共通型定義

export type Difficulty = "初級" | "中級" | "上級" | "超難問";

export const DIFFICULTIES: Difficulty[] = ["初級", "中級", "上級", "超難問"];

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  初級: "誰でも知っている主要キャラ・基本設定・有名な悪魔の実",
  中級: "各編の展開・懸賞金・覇気の種類・能力の詳細など",
  上級: "マイナーキャラ・地名・組織の細部・過去編や伏線",
  超難問: "SBS・扉絵連載・細かい数値や誕生日・小ネタなどコアファン向け",
};

// カテゴリのプリセット
export const PRESET_CATEGORIES = [
  "総合（ミックス）",
  "キャラクター",
  "悪魔の実",
  "懸賞金",
  "能力・技・覇気",
  "ストーリー・エピソード",
  "組織・勢力",
  "世界観・地理",
  "名言・名シーン",
] as const;

// 1問あたりの問題
export interface Question {
  q: string;
  options: string[]; // 4択
  answer: number; // 正解のインデックス（0始まり）
  explanation: string;
  difficulty: string;
  category: string;
}

// クイズ生成APIのレスポンス
export interface QuizResponse {
  questions: Question[];
}

// 出題設定
export interface QuizConfig {
  difficulty: Difficulty;
  category: string;
  count: number;
  latestMode: boolean;
}

// 採点方式
export type GradingMode = "batch" | "instant"; // batch=最後にまとめて / instant=1問ずつ即時

// ユーザー設定
export interface Settings {
  gradingMode: GradingMode;
}

// 履歴1件
export interface HistoryEntry {
  id: string;
  date: string; // ISO 8601
  difficulty: Difficulty;
  category: string;
  count: number;
  latestMode: boolean;
  questions: Question[];
  answers: (number | null)[]; // 各問のユーザーの回答（未回答は null）
  score: number;
}

// スコアボード（自己ベスト等）
export interface ScoreBoard {
  bestScorePercent: number; // 最高正答率（%）
  bestStreak: number; // 最高連続正解数
  totalAttempts: number; // 累計挑戦回数
  // 難易度別の正答率を算出するための集計
  perDifficulty: Record<
    string,
    { correct: number; total: number }
  >;
}

// 深掘りAPIのリクエスト/レスポンス
export interface ExplainResponse {
  explanation: string;
}
