"use client";

import { useEffect, useState } from "react";
import DifficultyPicker from "./components/DifficultyPicker";
import CategoryPicker from "./components/CategoryPicker";
import QuizPlayer from "./components/QuizPlayer";
import ResultView from "./components/ResultView";
import ScoreBoard from "./components/ScoreBoard";
import HistorySidebar from "./components/HistorySidebar";
import { withBasePath } from "@/lib/config";
import {
  addHistory,
  clearHistory,
  deleteHistory,
  loadHistory,
  loadScore,
  loadSettings,
  resetScore,
  saveSettings,
  updateScoreWithResult,
} from "@/lib/storage";
import type {
  Difficulty,
  GradingMode,
  HistoryEntry,
  Question,
  ScoreBoard as ScoreBoardType,
  Settings,
} from "@/lib/types";

type Phase = "select" | "loading" | "playing" | "result";
const COUNTS = [3, 5, 10];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("select");

  // 出題設定
  const [difficulty, setDifficulty] = useState<Difficulty>("初級");
  const [category, setCategory] = useState<string>("総合（ミックス）");
  const [count, setCount] = useState<number>(3);
  const [latestMode, setLatestMode] = useState<boolean>(false);

  // 進行中のクイズ
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 永続データ
  const [settings, setSettings] = useState<Settings>({ gradingMode: "batch" });
  const [score, setScore] = useState<ScoreBoardType | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // 初回ロード（クライアントのみ）
  useEffect(() => {
    setSettings(loadSettings());
    setScore(loadScore());
    setHistory(loadHistory());
  }, []);

  function setGradingMode(mode: GradingMode) {
    const next = { ...settings, gradingMode: mode };
    setSettings(next);
    saveSettings(next);
  }

  async function startQuiz() {
    setError(null);
    setPhase("loading");
    const endpoint = latestMode ? "/api/latest" : "/api/quiz";

    // 履歴から既出問題文を最大30件収集してモデルに渡す（重複防止）
    const seenQuestions = history
      .flatMap((entry) => entry.questions.map((q) => q.q))
      .slice(0, 30);

    try {
      const res = await fetch(withBasePath(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, category, count, seenQuestions }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "クイズの生成に失敗しました。");
        setPhase("select");
        return;
      }
      setQuestions(data.questions);
      setAnswers(data.questions.map(() => null));
      setPhase("playing");
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください。");
      setPhase("select");
    }
  }

  function finishQuiz(finalAnswers: (number | null)[]) {
    setAnswers(finalAnswers);

    // スコア更新
    const newScore = updateScoreWithResult(difficulty, questions, finalAnswers);
    setScore(newScore);

    // 履歴保存
    const correct = questions.reduce(
      (acc, q, i) => acc + (finalAnswers[i] === q.answer ? 1 : 0),
      0,
    );
    const entry: HistoryEntry = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      date: new Date().toISOString(),
      difficulty,
      category,
      count: questions.length,
      latestMode,
      questions,
      answers: finalAnswers,
      score: correct,
    };
    setHistory(addHistory(entry));

    setPhase("result");
  }

  function openHistory(entry: HistoryEntry) {
    setDifficulty(entry.difficulty);
    setCategory(entry.category);
    setQuestions(entry.questions);
    setAnswers(entry.answers);
    setLatestMode(entry.latestMode);
    setPhase("result");
    window.scrollTo({ top: 0 });
  }

  function handleDeleteHistory(id: string) {
    setHistory(deleteHistory(id));
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  function handleResetScore() {
    resetScore();
    setScore(loadScore());
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* ヘッダー */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-straw-700 sm:text-3xl">
          🏴‍☠️ ONE PIECE クイズ
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          難易度を選んで4択クイズに挑戦しよう
        </p>
      </header>

      {/* メインカード */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {phase === "select" && (
          <div className="space-y-5">
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <CategoryPicker value={category} onChange={setCategory} />

            {/* 問題数 */}
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                問題数
              </h2>
              <div className="flex gap-2">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCount(c)}
                    className={[
                      "rounded-lg border px-4 py-2 text-sm font-medium transition",
                      c === count
                        ? "border-straw-600 bg-straw-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-straw-300",
                    ].join(" ")}
                  >
                    {c}問
                  </button>
                ))}
              </div>
            </div>

            {/* オプション */}
            <div className="space-y-3 rounded-lg bg-gray-50 p-3">
              <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  即時採点（1問ずつ答え合わせ）
                </span>
                <input
                  type="checkbox"
                  checked={settings.gradingMode === "instant"}
                  onChange={(e) =>
                    setGradingMode(e.target.checked ? "instant" : "batch")
                  }
                  className="h-4 w-4 accent-straw-600"
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  ⚡ 最新話モード（Web検索）
                </span>
                <input
                  type="checkbox"
                  checked={latestMode}
                  onChange={(e) => setLatestMode(e.target.checked)}
                  className="h-4 w-4 accent-straw-600"
                />
              </label>
              {latestMode && (
                <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                  ⚠️ ネタバレ注意：最新話の展開に関する問題が出ます。Google検索のため生成に数十秒かかります。
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={startQuiz}
              className="w-full rounded-xl bg-straw-600 px-4 py-3.5 text-base font-bold text-white transition hover:bg-straw-700"
            >
              クイズ開始
            </button>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-straw-200 border-t-straw-600" />
            <p className="mt-4 text-sm text-gray-600">
              {latestMode ? "最新情報を検索中…" : "問題を作成中…"}
            </p>
            {latestMode && (
              <p className="mt-1 text-xs text-gray-400">
                Web検索のため数十秒かかります
              </p>
            )}
          </div>
        )}

        {phase === "playing" && (
          <QuizPlayer
            questions={questions}
            gradingMode={settings.gradingMode}
            onFinish={finishQuiz}
          />
        )}

        {phase === "result" && (
          <ResultView
            questions={questions}
            answers={answers}
            onRetry={() => {
              setPhase("loading");
              startQuiz();
            }}
            onHome={() => {
              setPhase("select");
              setError(null);
            }}
          />
        )}
      </section>

      {/* スコア & 履歴 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {score && <ScoreBoard score={score} onReset={handleResetScore} />}
        <HistorySidebar
          history={history}
          onOpen={openHistory}
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
        />
      </div>

      {/* フッター（権利・免責） */}
      <footer className="mt-8 space-y-1 text-center text-[11px] leading-relaxed text-gray-400">
        <p>
          本アプリは個人利用・学習目的の非公式ファンツールです。ONE PIECE は
          集英社／尾田栄一郎氏 の著作物です。
        </p>
        <p>
          問題・解説は AI（Claude）が生成しており、誤りを含む場合があります。
        </p>
      </footer>
    </main>
  );
}
