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

  return (
    <div>
      {/* サマリー */}
      <div className="mb-5 rounded-xl bg-straw-50 p-5 text-center">
        <div className="text-sm text-gray-500">結果</div>
        <div className="my-1 text-4xl font-extrabold text-straw-700">
          {correct}
          <span className="text-2xl text-gray-400"> / {total}</span>
        </div>
        <div className="text-sm text-gray-600">
          正答率 {percent}%・最大連続正解 {streak}
        </div>
      </div>

      {/* 免責（ハルシネーション対策D） */}
      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ⚠️ 問題と解説は AI（Claude）が生成しています。まれに誤りを含む可能性があります。
      </p>

      {/* 各問の見直し */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.answer;
          return (
            <div
              key={i}
              className={[
                "rounded-lg border p-4",
                isCorrect
                  ? "border-green-200 bg-white"
                  : "border-red-200 bg-red-50/40",
              ].join(" ")}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900">
                  <span className="mr-1 text-gray-400">Q{i + 1}.</span>
                  {q.q}
                </p>
                <span
                  className={[
                    "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                    isCorrect
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700",
                  ].join(" ")}
                >
                  {isCorrect ? "正解" : "不正解"}
                </span>
              </div>

              <ul className="space-y-1 text-sm">
                {q.options.map((opt, oi) => {
                  const isAns = oi === q.answer;
                  const isUser = oi === userAns;
                  return (
                    <li
                      key={oi}
                      className={[
                        "rounded px-2 py-1",
                        isAns
                          ? "bg-green-100 font-medium text-green-900"
                          : isUser
                            ? "bg-red-100 text-red-900"
                            : "text-gray-600",
                      ].join(" ")}
                    >
                      {LABELS[oi]}. {opt}
                      {isAns && " ← 正解"}
                      {isUser && !isAns && " ← あなたの回答"}
                      {isUser && userAns === null}
                    </li>
                  );
                })}
                {userAns === null && (
                  <li className="px-2 text-xs text-gray-400">（未回答）</li>
                )}
              </ul>

              <p className="mt-2 rounded bg-gray-50 px-2 py-1.5 text-sm text-gray-600">
                💡 {q.explanation}
              </p>

              <div className="mt-1 flex items-center justify-between">
                <ExplainButton topic={q.category} />
                <ReportButton />
              </div>
            </div>
          );
        })}
      </div>

      {/* 操作 */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-lg bg-straw-600 px-4 py-3 font-semibold text-white transition hover:bg-straw-700"
        >
          もう一度挑戦
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          設定に戻る
        </button>
      </div>
    </div>
  );
}

// 「この問題は間違っている」報告ボタン（ローカル完結・導線のみ）
function ReportButton() {
  const [reported, setReported] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setReported(true)}
      disabled={reported}
      className="text-xs text-gray-400 hover:text-gray-600"
      title="この問題に誤りがあると感じたら報告できます"
    >
      {reported ? "報告ありがとうございます" : "⚑ 誤りを報告"}
    </button>
  );
}
