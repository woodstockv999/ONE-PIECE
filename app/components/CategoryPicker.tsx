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
      <h2 className="mb-2 text-sm font-semibold text-gray-700">カテゴリ</h2>
      <div className="flex flex-wrap gap-2">
        {PRESET_CATEGORIES.map((c) => {
          const active = c === value;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={[
                "rounded-full border px-3 py-1.5 text-sm transition",
                active
                  ? "border-straw-600 bg-straw-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-straw-300",
              ].join(" ")}
              aria-pressed={active}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-gray-500">
          自由入力（特定の編なども指定可。例：ワノ国編、空島編、頂上戦争）
        </label>
        <input
          type="text"
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="自由にカテゴリ・テーマを入力"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-straw-500 focus:outline-none focus:ring-1 focus:ring-straw-500"
        />
      </div>
    </div>
  );
}
