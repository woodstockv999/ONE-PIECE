"use client";

import type { ScoreBoard as ScoreBoardType } from "@/lib/types";
import { DIFFICULTIES } from "@/lib/types";

export default function ScoreBoard({
  score,
  onReset,
}: {
  score: ScoreBoardType;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">自己ベスト記録</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          リセット
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="最高正答率" value={`${score.bestScorePercent}%`} />
        <Stat label="最高連続正解" value={`${score.bestStreak}`} />
        <Stat label="累計挑戦" value={`${score.totalAttempts}`} />
      </div>

      {/* 難易度別 正答率 */}
      <div className="mt-3 space-y-1">
        {DIFFICULTIES.map((d) => {
          const s = score.perDifficulty[d];
          const pct =
            s && s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
          return (
            <div
              key={d}
              className="flex items-center justify-between text-xs text-gray-500"
            >
              <span>{d}</span>
              <span>
                {pct === null ? "—" : `${pct}%`}
                {s && s.total > 0 && (
                  <span className="ml-1 text-gray-300">
                    ({s.correct}/{s.total})
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <div className="text-lg font-bold text-straw-700">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
