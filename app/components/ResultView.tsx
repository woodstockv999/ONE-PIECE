"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { computeBestStreak } from "@/lib/storage";
import ExplainButton from "./ExplainButton";

const LABELS = ["A", "B", "C", "D"];

export default function ResultView({
  questions,
  answers,
  onRetry,
  onHome,
}: {
  questions: Question[];
  answers: (number | null)[];
  onRetry: () => void;
  onHome: () => void;
}) {
  const correct = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
    0,
  );
  const total = questions.length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const streak = computeBestStreak(questions, answers);

  const rank =
    percent === 100
      ? "海賊王"
      : percent >= 80
        ? "四皇級"
        : percent >= 60
          ? "七武海級"
          : percent >= 40
            ? "新世界入門"
            : "東の海";

  return (
    <div>
      {/* スコアサマリー */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-straw-600 to-straw-800 p-6 text-center text-white shadow-lg">
        <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">
          クリア結果
        </div>
        <div className="my-1 text-6xl font-black">
          {correct}
          <span className="text-3xl opacity-50">/{total}</span>
        </div>
        <div className="text-xl font-bold opacity-90">{percent}% 正解</div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5">
          <span className="text-sm font-black">{rank}</span>
          {streak > 1 && (
            <span className="text-xs opacity-75">連続正解 {streak} 問</span>
          )}
        </div>
      </div>

      {/* 免責 */}
      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ⚠️ 問題と解説は AI（Claude）が生成しています。まれに誤りを含む可能性があります。
      </p>

      {/* 各問の見直し（アコーディオン） */}
      <div className="space-y-2">
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.answer;
          return (
            <ReviewCard
              key={i}
              q={q}
              index={i}
              userAns={userAns}
              isCorrect={isCorrect}
            />
          );
        })}
      </div>

      {/* 操作 */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-xl bg-straw-600 px-4 py-3.5 font-black text-white shadow-sm transition hover:bg-straw-700 active:scale-[0.98]"
        >
          もう一度挑戦
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex-1 rounded-xl border-2 border-[#ddd0b8] bg-white px-4 py-3.5 font-bold text-[#5a4a38] transition hover:border-straw-400"
        >
          トップへ戻る
        </button>
      </div>
    </div>
  );
}

function ReviewCard({
  q,
  index,
  userAns,
  isCorrect,
}: {
  q: Question;
  index: number;
  userAns: number | null;
  isCorrect: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border-2",
        isCorrect ? "border-emerald-200" : "border-red-200",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={[
          "flex w-full items-center gap-3 px-4 py-3 text-left",
          isCorrect ? "bg-emerald-50" : "bg-red-50",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white",
            isCorrect ? "bg-emerald-500" : "bg-red-400",
          ].join(" ")}
        >
          {isCorrect ? "○" : "×"}
        </span>
        <span className="flex-1 text-sm font-bold text-[#1c1209]">
          Q{index + 1}. {q.q}
        </span>
        <span className="flex-shrink-0 text-sm text-[#b0a080]">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="bg-white px-4 pb-4 pt-3">
          <ul className="mb-3 space-y-1">
            {q.options.map((opt, oi) => {
              const isAns = oi === q.answer;
              const isUser = oi === userAns;
              return (
                <li
                  key={oi}
                  className={[
                    "rounded-lg px-3 py-1.5 text-sm",
                    isAns
                      ? "bg-emerald-100 font-bold text-emerald-900"
                      : isUser
                        ? "bg-red-100 text-red-900"
                        : "text-[#7a6a52]",
                  ].join(" ")}
                >
                  {LABELS[oi]}. {opt}
                  {isAns && (
                    <span className="ml-1 text-emerald-700">← 正解</span>
                  )}
                  {isUser && !isAns && (
                    <span className="ml-1 text-red-600">← あなたの回答</span>
                  )}
                </li>
              );
            })}
            {userAns === null && (
              <li className="px-2 text-xs text-[#b0a080]">（未回答）</li>
            )}
          </ul>
          <div className="rounded-xl border border-[#e2cfa8] bg-[#fdf7ef] px-3 py-2.5 text-sm leading-relaxed text-[#3a2a18]">
            💡 {q.explanation}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <ExplainButton topic={q.category} />
            <ReportButton />
          </div>
        </div>
      )}
    </div>
  );
}

function ReportButton() {
  const [reported, setReported] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setReported(true)}
      disabled={reported}
      className="text-xs text-[#c0b090] transition hover:text-[#7a6a52]"
    >
      {reported ? "報告ありがとうございます" : "⚑ 誤りを報告"}
    </button>
  );
}
