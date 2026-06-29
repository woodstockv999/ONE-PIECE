"use client";

import {
  DIFFICULTIES,
  DIFFICULTY_DESCRIPTIONS,
  type Difficulty,
} from "@/lib/types";

const DIFF_CONFIG: Record<
  Difficulty,
  { icon: string; activeClasses: string }
> = {
  初級: {
    icon: "🌊",
    activeClasses:
      "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400",
  },
  中級: {
    icon: "⚔️",
    activeClasses: "border-amber-500 bg-amber-50 ring-2 ring-amber-400",
  },
  上級: {
    icon: "🔥",
    activeClasses: "border-straw-600 bg-straw-50 ring-2 ring-straw-500",
  },
  超難問: {
    icon: "💀",
    activeClasses:
      "border-purple-600 bg-purple-50 ring-2 ring-purple-500",
  },
};

export default function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  return (
    <div>
      <h2 className="mb-2.5 text-xs font-black text-[#5a4a38] uppercase tracking-widest">
        難易度
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DIFFICULTIES.map((d) => {
          const conf = DIFF_CONFIG[d];
          const active = d === value;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              aria-pressed={active}
              className={[
                "rounded-xl border-2 p-3 text-left transition-all",
                active
                  ? conf.activeClasses
                  : "border-[#ddd0b8] bg-white hover:border-[#c8b89a]",
              ].join(" ")}
            >
              <div className="mb-1 text-xl">{conf.icon}</div>
              <div className="text-sm font-black text-[#1c1209]">{d}</div>
              <div className="mt-0.5 text-[10px] leading-tight text-[#7a6a52]">
                {DIFFICULTY_DESCRIPTIONS[d]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
