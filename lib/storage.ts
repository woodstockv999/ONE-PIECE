// localStorage ラッパー（履歴・スコア・設定）
// SSR 安全のため、すべて typeof window のガードを通す。

import type {
  HistoryEntry,
  ScoreBoard,
  Settings,
  Question,
  Difficulty,
} from "./types";

const HISTORY_KEY = "op-quiz:history";
const SCORE_KEY = "op-quiz:score";
const SETTINGS_KEY = "op-quiz:settings";

const MAX_HISTORY = 50; // 履歴の保持上限

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- 設定 ----

export function loadSettings(): Settings {
  if (!isBrowser()) return { gradingMode: "batch" };
  return safeParse<Settings>(localStorage.getItem(SETTINGS_KEY), {
    gradingMode: "batch",
  });
}

export function saveSettings(settings: Settings): void {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- 履歴 ----

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  return safeParse<HistoryEntry[]>(localStorage.getItem(HISTORY_KEY), []);
}

export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  if (!isBrowser()) return [];
  const history = loadHistory();
  const next = [entry, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function deleteHistory(id: string): HistoryEntry[] {
  if (!isBrowser()) return [];
  const next = loadHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(HISTORY_KEY);
}

// ---- スコアボード ----

const EMPTY_SCORE: ScoreBoard = {
  bestScorePercent: 0,
  bestStreak: 0,
  totalAttempts: 0,
  perDifficulty: {},
};

export function loadScore(): ScoreBoard {
  if (!isBrowser()) return { ...EMPTY_SCORE };
  return safeParse<ScoreBoard>(localStorage.getItem(SCORE_KEY), {
    ...EMPTY_SCORE,
  });
}

export function saveScore(score: ScoreBoard): void {
  if (!isBrowser()) return;
  localStorage.setItem(SCORE_KEY, JSON.stringify(score));
}

export function resetScore(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SCORE_KEY);
}

// 最長連続正解数を算出
export function computeBestStreak(
  questions: Question[],
  answers: (number | null)[],
): number {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] !== null && answers[i] === questions[i].answer) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

// 1回の挑戦結果をスコアボードへ反映して返す
export function updateScoreWithResult(
  difficulty: Difficulty,
  questions: Question[],
  answers: (number | null)[],
): ScoreBoard {
  const score = loadScore();
  const correct = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
    0,
  );
  const total = questions.length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const streak = computeBestStreak(questions, answers);

  score.totalAttempts += 1;
  score.bestScorePercent = Math.max(score.bestScorePercent, percent);
  score.bestStreak = Math.max(score.bestStreak, streak);

  const prev = score.perDifficulty[difficulty] ?? { correct: 0, total: 0 };
  score.perDifficulty[difficulty] = {
    correct: prev.correct + correct,
    total: prev.total + total,
  };

  saveScore(score);
  return score;
}
