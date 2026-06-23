import { NextRequest, NextResponse } from "next/server";
import { buildLatestQuizPrompt } from "@/lib/prompts";
import { cleanJson, parseQuiz } from "@/lib/parse";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";
import { createGeminiClient, generateWithRetry } from "@/lib/geminiClient";
import { getDummyLatestQuiz } from "@/lib/dummyQuiz";

export const runtime = "nodejs";
// Google Search + 生成 + 429 retry wait で最大120秒
export const maxDuration = 120;

const MODEL = "gemini-2.5-flash";

// GEMINI_DEBUG_KEY と一致するときはダミーデータを返す（レートリミット回避用）
const DEBUG_KEY = process.env.GEMINI_DEBUG_KEY ?? "";

export async function POST(req: NextRequest) {
  let body: { difficulty?: string; category?: string; count?: number; seenQuestions?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const difficulty = (body.difficulty ?? "初級") as Difficulty;
  const category = (body.category ?? "総合（ミックス）").toString().slice(0, 60);
  const count = Math.min(Math.max(Number(body.count) || 3, 1), 10);
  const seenQuestions = Array.isArray(body.seenQuestions)
    ? body.seenQuestions.filter((q) => typeof q === "string").slice(0, 30)
    : [];

  if (!DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "難易度が不正です。" }, { status: 400 });
  }

  // デバッグモード：GEMINI_API_KEY が GEMINI_DEBUG_KEY と一致する場合はダミーデータを返す
  if (DEBUG_KEY && process.env.GEMINI_API_KEY === DEBUG_KEY) {
    const data = getDummyLatestQuiz(count);
    return NextResponse.json({ ...data, _debug: true });
  }

  let ai: ReturnType<typeof createGeminiClient>;
  try {
    ai = createGeminiClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  try {
    const text = await generateWithRetry(
      ai,
      MODEL,
      buildLatestQuizPrompt(difficulty, category, count, seenQuestions),
      [{ googleSearch: {} }],
    );

    const data = parseQuiz(cleanJson(text));

    if (!data) {
      return NextResponse.json(
        { error: "クイズの生成に失敗しました。もう一度お試しください。" },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message ?? "");
    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    // レートリミット・過負荷時はダミーデータにフォールバック（GEMINI_DEBUG_KEY が設定済みの場合のみ）
    const isRateLimited =
      msg.includes('"code":429') ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes('"code":503') ||
      msg.includes("UNAVAILABLE");
    if (isRateLimited && DEBUG_KEY) {
      const data = getDummyLatestQuiz(count);
      return NextResponse.json({ ...data, _debug: true });
    }
    if (msg.includes('"code":429') || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Gemini APIのクォータを超過しました。しばらく待ってから再度お試しください。" },
        { status: 429 },
      );
    }
    if (msg.includes('"code":503') || msg.includes("UNAVAILABLE")) {
      return NextResponse.json(
        { error: "Gemini APIが一時的に混雑しています。しばらく待ってから再度お試しください。" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "クイズの生成に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
