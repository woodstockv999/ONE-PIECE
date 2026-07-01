import { NextRequest, NextResponse } from "next/server";
import { buildLatestQuizPrompt } from "@/lib/prompts";
import { cleanJson, parseQuiz } from "@/lib/parse";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";
import { generateWithCliSearch } from "@/lib/claudeCli";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
// 速度優先: Web検索+生成で最大60秒程度（lib/claudeCli.tsのTIMEOUT_MSと合わせる）
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429 },
    );
  }

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

  try {
    const text = await generateWithCliSearch(
      buildLatestQuizPrompt(difficulty, category, count, seenQuestions),
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
    if (msg.includes("CLAUDE_CLI_TIMEOUT")) {
      return NextResponse.json(
        { error: "検索に時間がかかっています。しばらく待ってから再度お試しください。" },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "クイズの生成に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
