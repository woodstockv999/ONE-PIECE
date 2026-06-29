"use client";

import { PRESET_CATEGORIES } from "@/lib/types";

export default function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  const isPreset = (PRESET_CATEGORIES as readonly string[]).includes(value);

  return (
    <div>
      <h2 className="mb-2.5 text-xs font-black text-[#5a4a38] uppercase tracking-widest">
        カテゴリ
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_CATEGORIES.map((c) => {
          const active = c === value;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-pressed={active}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-all",
                active
                  ? "border-straw-600 bg-straw-600 text-white shadow-sm"
                  : "border-[#d9c9a8] bg-white text-[#5a4a38] hover:border-straw-400 hover:text-straw-700",
              ].join(" ")}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5">
        <input
          type="text"
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="自由入力：ワノ国編、空島編、頂上戦争など"
          className="w-full rounded-xl border-2 border-[#d9c9a8] bg-white px-3 py-2 text-sm text-[#3a2a18] placeholder:text-[#b0a080] transition focus:border-straw-500 focus:outline-none focus:ring-1 focus:ring-straw-500"
        />
      </div>
    </div>
  );
}
