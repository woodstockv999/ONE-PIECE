"use client";

import {
  DIFFICULTIES,
  DIFFICULTY_DESCRIPTIONS,
  type Difficulty,
} from "@/lib/types";

export default function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">難易度</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DIFFICULTIES.map((d) => {
          const active = d === value;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className={[
                "rounded-lg border p-3 text-left transition",
                active
                  ? "border-straw-600 bg-straw-50 ring-2 ring-straw-500"
                  : "border-gray-200 bg-white hover:border-straw-300",
              ].join(" ")}
              aria-pressed={active}
            >
              <div className="font-bold text-gray-900">{d}</div>
              <div className="mt-1 text-[11px] leading-tight text-gray-500">
                {DIFFICULTY_DESCRIPTIONS[d]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
