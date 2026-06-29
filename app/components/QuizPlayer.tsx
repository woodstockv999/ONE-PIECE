"use client";

import { useState } from "react";
import type { GradingMode, Question } from "@/lib/types";

const LABELS = ["A", "B", "C", "D"];

export default function QuizPlayer({
  questions,
  gradingMode,
  onFinish,
}: {
  questions: Question[];
  gradingMode: GradingMode;
  onFinish: (answers: (number | null)[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => questions.map(() => null),
  );
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    questions.map(() => false),
  );

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const selected = answers[index];
  const isRevealed = gradingMode === "instant" && revealed[index];
  const allAnswered = answers.every((a) => a !== null);

  function choose(optIdx: number) {
    if (isRevealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = optIdx;
      return next;
    });
  }

  function confirmInstant() {
    setRevealed((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }

  function next() {
    if (isLast) {
      onFinish(answers);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div>
      {/* 進捗 */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-black text-[#7a6a52] uppercase tracking-wide">
            第 {index + 1} 問 / 全 {questions.length} 問
          </span>
          <span className="rounded-full bg-[#f0e4cc] px-2.5 py-0.5 text-[10px] font-medium text-[#7a6a52]">
            {q.difficulty} · {q.category}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8d8be]">
          <div
            className="h-full rounded-full bg-straw-500 transition-all duration-500"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 問題文 */}
      <p className="mb-5 text-lg font-bold leading-relaxed text-[#1c1209]">
        {q.q}
      </p>

      {/* 選択肢 */}
      <div className="space-y-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.answer;

          let cls =
            "border-[#ddd0b8] bg-white text-[#1c1209] hover:border-straw-400 hover:bg-[#fef9f4]";
          if (isRevealed) {
            if (isCorrect)
              cls = "border-emerald-500 bg-emerald-50 text-emerald-900";
            else if (isSelected)
              cls = "border-red-400 bg-red-50 text-red-900";
            else cls = "border-[#e8d8be] bg-white text-[#b0a080]";
          } else if (isSelected) {
            cls =
              "border-straw-600 bg-straw-50 text-[#1c1209] ring-2 ring-straw-500 shadow-sm";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={isRevealed}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${cls}`}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-current text-xs font-black">
                {LABELS[i]}
              </span>
              <span className="flex-1 text-sm font-medium leading-snug">
                {opt}
              </span>
              {isRevealed && isCorrect && (
                <span className="text-sm font-black text-emerald-600">✓</span>
              )}
              {isRevealed && isSelected && !isCorrect && (
                <span className="text-sm font-black text-red-500">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* instant モードの即時解説 */}
      {isRevealed && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            selected === q.answer
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p
            className={`mb-1 text-base font-black ${
              selected === q.answer ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {selected === q.answer ? "正解！🎉" : "不正解…"}
          </p>
          <p className="leading-relaxed text-[#3a2a18]">{q.explanation}</p>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-xl border-2 border-[#ddd0b8] px-4 py-2.5 text-sm font-medium text-[#7a6a52] transition hover:border-[#c8b89a] disabled:opacity-30"
        >
          ← 前へ
        </button>

        <div className="flex-1" />

        {gradingMode === "instant" && !isRevealed ? (
          <button
            type="button"
            onClick={confirmInstant}
            disabled={selected === null}
            className="rounded-xl bg-straw-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-straw-700 active:scale-95 disabled:opacity-40"
          >
            回答する
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={
              gradingMode === "batch" && isLast
                ? !allAnswered
                : selected === null && gradingMode === "batch"
            }
            className="rounded-xl bg-straw-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-straw-700 active:scale-95 disabled:opacity-40"
          >
            {isLast ? "採点する →" : "次へ →"}
          </button>
        )}
      </div>

      {gradingMode === "batch" && isLast && !allAnswered && (
        <p className="mt-2 text-right text-xs text-red-500">
          すべての問題に回答してください。
        </p>
      )}
    </div>
  );
}
