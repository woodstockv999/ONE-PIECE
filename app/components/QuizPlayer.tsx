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
  // instant モード：その問の正解を表示済みか
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    questions.map(() => false),
  );

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const selected = answers[index];
  const isRevealed = gradingMode === "instant" && revealed[index];

  function choose(optIdx: number) {
    if (isRevealed) return; // 即時採点で確定後は変更不可
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

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div>
      {/* 進捗 */}
      <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
        <span>
          第 {index + 1} 問 / 全 {questions.length} 問
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
          {q.difficulty}・{q.category}
        </span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-straw-500 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* 問題文 */}
      <p className="mb-4 text-lg font-semibold leading-relaxed text-gray-900">
        {q.q}
      </p>

      {/* 選択肢 */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.answer;

          let cls =
            "border-gray-200 bg-white hover:border-straw-300 text-gray-800";
          if (isRevealed) {
            if (isCorrect) {
              cls = "border-green-500 bg-green-50 text-green-900";
            } else if (isSelected) {
              cls = "border-red-400 bg-red-50 text-red-900";
            } else {
              cls = "border-gray-200 bg-white text-gray-500";
            }
          } else if (isSelected) {
            cls = "border-straw-600 bg-straw-50 text-gray-900 ring-2 ring-straw-500";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={isRevealed}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${cls}`}
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                {LABELS[i]}
              </span>
              <span className="flex-1">{opt}</span>
              {isRevealed && isCorrect && <span aria-hidden>✓</span>}
              {isRevealed && isSelected && !isCorrect && (
                <span aria-hidden>✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* instant モードの即時解説 */}
      {isRevealed && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="font-semibold text-gray-800">
            {selected === q.answer ? "正解！" : "不正解"}
          </p>
          <p className="mt-1 text-gray-600">{q.explanation}</p>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-lg px-3 py-2 text-sm text-gray-500 disabled:opacity-40"
        >
          ← 前へ
        </button>

        {gradingMode === "instant" && !isRevealed ? (
          <button
            type="button"
            onClick={confirmInstant}
            disabled={selected === null}
            className="rounded-lg bg-straw-600 px-5 py-2 font-semibold text-white transition hover:bg-straw-700 disabled:opacity-40"
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
            className="rounded-lg bg-straw-600 px-5 py-2 font-semibold text-white transition hover:bg-straw-700 disabled:opacity-40"
          >
            {isLast ? "採点する" : "次へ →"}
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
