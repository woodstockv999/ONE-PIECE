"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { withBasePath } from "@/lib/config";

// 用語・トピックを ONE PIECE の文脈で深掘り解説するボタン（§4-7）
export default function ExplainButton({ topic }: { topic: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (text) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch(withBasePath("/api/explain"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "解説の取得に失敗しました。");
      } else {
        setText(data.explanation);
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={run}
        className="text-xs font-medium text-straw-700 underline-offset-2 hover:underline"
      >
        🔎 「{topic}」を深掘り
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
          {loading && <p className="text-gray-500">解説を生成中…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {text && (
            <div className="markdown text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
