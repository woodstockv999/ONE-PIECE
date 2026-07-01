// Anthropic レスポンスからテキストを取り出し、安全に Question[] へパースする共通処理。

import type { Question, QuizResponse } from "./types";

// content 配列から type === "text" のブロックのみを連結する。
// （Web検索併用時に server_tool_use 等が混ざっても壊れないように、
//  インデックス位置ではなく type でフィルタする）
export function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: string; text: string } => {
      return (
        typeof b === "object" &&
        b !== null &&
        (b as { type?: unknown }).type === "text" &&
        typeof (b as { text?: unknown }).text === "string"
      );
    })
    .map((b) => b.text)
    .join("\n");
}

// ```json フェンス等を除去し、前後の余分なテキスト（Web検索の出典表記等）を
// 切り落として純粋なJSON本体だけを取り出す
export function cleanJson(text: string): string {
  const stripped = text.replace(/```json|```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return stripped.slice(start, end + 1);
  }
  return stripped;
}

// 1問のバリデーション
function isValidQuestion(q: unknown): q is Question {
  if (typeof q !== "object" || q === null) return false;
  const obj = q as Record<string, unknown>;
  if (typeof obj.q !== "string") return false;
  if (!Array.isArray(obj.options) || obj.options.length !== 4) return false;
  if (!obj.options.every((o) => typeof o === "string")) return false;
  if (
    typeof obj.answer !== "number" ||
    obj.answer < 0 ||
    obj.answer > 3 ||
    !Number.isInteger(obj.answer)
  )
    return false;
  if (typeof obj.explanation !== "string") return false;
  return true;
}

// テキストから QuizResponse を生成。失敗時は null。
export function parseQuiz(text: string): QuizResponse | null {
  const cleaned = cleanJson(text);
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const questions = (data as { questions?: unknown }).questions;
  if (!Array.isArray(questions) || questions.length === 0) return null;
  if (!questions.every(isValidQuestion)) return null;
  return { questions: questions as Question[] };
}
