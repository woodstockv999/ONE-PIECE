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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-white/80">
          📜 挑戦履歴
          {history.length > 0 && (
            <span className="ml-1 text-xs font-normal text-white/30">
              ({history.length})
            </span>
          )}
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-white/30 transition hover:text-red-400"
          >
            全削除
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-xs leading-relaxed text-white/30">
          まだ履歴がありません。クイズに挑戦すると記録されます。
        </p>
      ) : (
        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {history.map((h) => {
            const pct =
              h.questions.length > 0
                ? Math.round((h.score / h.questions.length) * 100)
                : 0;
            return (
              <li
                key={h.id}
                className="group rounded-lg border border-white/5 bg-white/5 transition hover:bg-white/10"
              >
                <button
                  type="button"
                  onClick={() => onOpen(h)}
                  className="block w-full px-3 py-2 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80">
                      {h.difficulty}
                      {h.latestMode && " ⚡"}
                    </span>
                    <span
                      className={[
                        "text-xs font-black",
                        pct >= 80
                          ? "text-emerald-400"
                          : pct >= 60
                            ? "text-amber-400"
                            : "text-red-400",
                      ].join(" ")}
                    >
                      {h.score}/{h.questions.length} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-white/40">
                    {h.category}
                  </div>
                  <div className="text-[9px] text-white/25">
                    {formatDate(h.date)}
                  </div>
                </button>
                <div className="px-3 pb-2">
                  <button
                    type="button"
                    onClick={() => onDelete(h.id)}
                    className="text-[10px] text-white/20 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
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
