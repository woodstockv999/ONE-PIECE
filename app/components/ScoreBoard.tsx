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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-white/80">🏆 自己ベスト</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-white/30 transition hover:text-red-400"
        >
          リセット
        </button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <StatCell label="最高正答率" value={`${score.bestScorePercent}%`} />
        <StatCell label="最高連続" value={`${score.bestStreak}問`} />
        <StatCell label="累計挑戦" value={`${score.totalAttempts}回`} />
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        {DIFFICULTIES.map((d) => {
          const s = score.perDifficulty[d];
          const pct =
            s && s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
          return (
            <div key={d} className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/50">{d}</span>
              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-straw-500 transition-all"
                    style={{ width: pct !== null ? `${pct}%` : "0%" }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-white/60">
                  {pct === null ? "—" : `${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2.5 text-center">
      <div className="text-lg font-black text-straw-400">{value}</div>
      <div className="mt-0.5 text-[9px] leading-tight text-white/35">{label}</div>
    </div>
  );
}
