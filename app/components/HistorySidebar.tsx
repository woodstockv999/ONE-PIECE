"use client";

import type { HistoryEntry } from "@/lib/types";

export default function HistorySidebar({
  history,
  onOpen,
  onDelete,
  onClear,
}: {
  history: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          挑戦履歴
          {history.length > 0 && (
            <span className="ml-1 text-xs text-gray-400">
              ({history.length})
            </span>
          )}
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            すべて削除
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-gray-400">
          まだ履歴がありません。クイズに挑戦すると、ここに記録されます。
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {history.map((h) => {
            const pct =
              h.questions.length > 0
                ? Math.round((h.score / h.questions.length) * 100)
                : 0;
            return (
              <li
                key={h.id}
                className="rounded-lg border border-gray-100 p-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => onOpen(h)}
                  className="block w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {h.difficulty}
                      {h.latestMode && " ⚡"}
                    </span>
                    <span className="text-xs text-straw-700">
                      {h.score}/{h.questions.length}（{pct}%）
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {h.category}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(h.date)}
                  </div>
                </button>
                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(h.id)}
                    className="text-[10px] text-gray-300 hover:text-red-500"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
