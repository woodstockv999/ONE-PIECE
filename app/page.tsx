"use client";

import { useEffect, useRef, useState } from "react";
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
  const [difficulty, setDifficulty] = useState<Difficulty>("初級");
  const [category, setCategory] = useState<string>("総合（ミックス）");
  const [count, setCount] = useState<number>(5);
  const [latestMode, setLatestMode] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({ gradingMode: "batch" });
  const [score, setScore] = useState<ScoreBoardType | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setScore(loadScore());
    setHistory(loadHistory());
    return () => { abortRef.current?.abort(); };
  }, []);

  function setGradingMode(mode: GradingMode) {
    const next = { ...settings, gradingMode: mode };
    setSettings(next);
    saveSettings(next);
  }

  async function startQuiz() {
    // 前のリクエストをキャンセルして並行実行を防ぐ
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setError(null);
    setPhase("loading");
    const endpoint = latestMode ? "/api/latest" : "/api/quiz";

    const hist = loadHistory();
    // 同カテゴリの既出問題を優先してモデルに渡す（重複防止の精度向上）
    const sameCat = hist
      .filter((e) => e.category === category)
      .flatMap((e) => e.questions.map((q) => q.q));
    const otherCat = hist
      .filter((e) => e.category !== category)
      .flatMap((e) => e.questions.map((q) => q.q));
    const seenQuestions = [
      ...new Set([...sameCat.slice(0, 80), ...otherCat.slice(0, 20)]),
    ];

    try {
      const res = await fetch(withBasePath(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, category, count, seenQuestions }),
        signal: abort.signal,
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        setError("サーバーエラーが発生しました。しばらく待ってから再度お試しください。");
        setPhase("select");
        return;
      }
      if (!res.ok) {
        setError((data as { error?: string })?.error ?? "クイズの生成に失敗しました。");
        setPhase("select");
        return;
      }
      const d = data as { questions: Question[] };

      // クライアント側でも完全一致の重複を除去（モデルが指示を無視した場合の保険）
      const seenSet = new Set(hist.flatMap((e) => e.questions.map((q) => q.q)));
      const fresh = d.questions.filter((q) => !seenSet.has(q.q));
      let finalQuestions = fresh.slice(0, count);
      if (finalQuestions.length < count) {
        // 新鮮な問題だけでは要求件数に満たない場合、取得済みの既出問題で不足分を
        // 補い、要求された count 件を確実に返す（サイレントな件数不足を防ぐ）
        const pickedSet = new Set(finalQuestions.map((q) => q.q));
        const alreadySeen = d.questions.filter((q) => !pickedSet.has(q.q));
        finalQuestions = [...finalQuestions, ...alreadySeen].slice(0, count);
      }

      setQuestions(finalQuestions);
      setAnswers(finalQuestions.map(() => null));
      setPhase("playing");
    } catch (err) {
      // ページを離れた・Safariを閉じた場合は AbortError — エラー表示しない
      if (err instanceof Error && err.name === "AbortError") return;
      setError("通信に失敗しました。ネットワークを確認してください。");
      setPhase("select");
    }
  }

  function finishQuiz(finalAnswers: (number | null)[]) {
    setAnswers(finalAnswers);
    const newScore = updateScoreWithResult(difficulty, questions, finalAnswers);
    setScore(newScore);
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

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-1.5 border-b border-white/10 bg-[#0d1b2a]/95 px-4 py-2.5 text-xs font-medium backdrop-blur">
        <a href="/" className="text-white/35 transition hover:text-white/60" title="アプリ一覧へ戻る">
          🏠 ポータル
        </a>
        <span className="text-white/45">›</span>
        <span className="text-white/70 font-semibold">🏴‍☠️ 道場</span>
      </div>
      <main className="mx-auto max-w-[600px] px-4 py-8 sm:py-12">
      {/* ヘッダー */}
      <header className="mb-7 text-center">
        <div className="text-5xl leading-none mb-2">🏴‍☠️</div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          ONE PIECE <span className="text-straw-400">クイズ</span>
        </h1>
        <p className="mt-1.5 text-sm text-white/40">4択クイズで海賊知識を試せ</p>
      </header>

      {/* メインカード */}
      <section className="rounded-2xl border border-[#e2cfa8] bg-[#fdf7ef] shadow-[0_8px_40px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-straw-600 via-gold-500 to-straw-600" />

        <div className="p-5 sm:p-7">
          {phase === "select" && (
            <div className="space-y-6">
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
              <CategoryPicker value={category} onChange={setCategory} />

              {/* 問題数 */}
              <div>
                <h2 className="mb-2.5 text-xs font-black text-[#5a4a38] uppercase tracking-widest">
                  問題数
                </h2>
                <div className="flex gap-2">
                  {COUNTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCount(c)}
                      className={[
                        "flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all",
                        c === count
                          ? "border-straw-600 bg-straw-600 text-white shadow-sm"
                          : "border-[#ddd0b8] bg-white text-[#5a4a38] hover:border-straw-400",
                      ].join(" ")}
                    >
                      {c}問
                    </button>
                  ))}
                </div>
              </div>

              {/* オプション */}
              <div className="rounded-xl border border-[#e2cfa8] bg-[#f5ead5] p-4 space-y-3">
                <ToggleRow
                  label="即時採点（1問ずつ答え合わせ）"
                  checked={settings.gradingMode === "instant"}
                  onChange={(v) => setGradingMode(v ? "instant" : "batch")}
                />
                <div className="h-px bg-[#e2cfa8]" />
                <ToggleRow
                  label="⚡ 最新話モード（Web検索）"
                  checked={latestMode}
                  onChange={setLatestMode}
                />
                {latestMode && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    ⚠️ ネタバレ注意：最新話の内容が出ます。Google検索のため数十秒かかります。
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={startQuiz}
                className="w-full rounded-xl bg-straw-600 px-4 py-4 text-base font-black text-white shadow-md transition hover:bg-straw-700 active:scale-[0.98]"
              >
                ⚓ クイズ開始
              </button>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#e2cfa8] border-t-straw-600" />
              <div className="text-center">
                <p className="font-bold text-[#3a2a18]">
                  {latestMode ? "最新情報を検索中…" : "問題を生成中…"}
                </p>
                {latestMode && (
                  <p className="mt-1 text-xs text-[#7a6a52]">
                    Web検索のため数十秒かかります
                  </p>
                )}
              </div>
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
              onRetry={startQuiz}
              onHome={() => {
                setPhase("select");
                setError(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>
      </section>

      {/* スコア & 履歴 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {score && (
          <ScoreBoard
            score={score}
            onReset={() => {
              resetScore();
              setScore(loadScore());
            }}
          />
        )}
        <HistorySidebar
          history={history}
          onOpen={openHistory}
          onDelete={(id) => setHistory(deleteHistory(id))}
          onClear={() => {
            clearHistory();
            setHistory([]);
          }}
        />
      </div>

      <footer className="mt-8 space-y-1 text-center text-[11px] leading-relaxed text-white/25">
        <p>
          本アプリは個人利用・学習目的の非公式ファンツールです。ONE PIECE は
          集英社／尾田栄一郎氏の著作物です。
        </p>
        <p>問題・解説は AI（Claude）が生成しており、誤りを含む場合があります。</p>
      </footer>
      </main>
    </>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-[#3a2a18]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-straw-600" : "bg-[#ccc0a0]",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
