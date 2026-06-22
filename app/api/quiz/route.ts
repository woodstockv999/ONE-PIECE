import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildQuizPrompt, maxTokensForCount } from "@/lib/prompts";
import { extractText, parseQuiz } from "@/lib/parse";
import { errStatus, toUserMessage } from "@/lib/apiError";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export const runtime = "nodejs";
// 生成に数秒かかるため余裕を持たせる（Vercel の関数タイムアウト目安）
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6"; // 正答精度を重視（§3・§12）

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "APIキーが設定されていません。サーバーの環境変数 ANTHROPIC_API_KEY を設定してください。",
      },
      { status: 500 },
    );
  }

  let body: { difficulty?: string; category?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const difficulty = (body.difficulty ?? "初級") as Difficulty;
  const category = (body.category ?? "総合（ミックス）").toString().slice(0, 60);
  const count = Math.min(Math.max(Number(body.count) || 3, 1), 10);

  if (!DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "難易度が不正です。" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokensForCount(count),
      messages: [
        { role: "user", content: buildQuizPrompt(difficulty, category, count) },
      ],
    });

    const text = extractText(response.content);
    const data = parseQuiz(text);

    if (!data) {
      return NextResponse.json(
        { error: "クイズの生成に失敗しました。もう一度お試しください。" },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: toUserMessage(err) },
      { status: errStatus(err) },
    );
  }
}
