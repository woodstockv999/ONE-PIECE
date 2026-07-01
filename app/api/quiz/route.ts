import { NextRequest, NextResponse } from "next/server";
import { buildQuizPrompt, maxTokensForCount } from "@/lib/prompts";
import { extractText, parseQuiz } from "@/lib/parse";
import { errStatus, toUserMessage } from "@/lib/apiError";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";
import { createAnthropicClient } from "@/lib/claudeClient";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
// 生成に数秒かかるため余裕を持たせる（Vercel の関数タイムアウト目安）
export const maxDuration = 60;

// claude-opus-4-8 を試したが、この経路（Anthropic SDK直叩き + OAuthトークン）では
// 即 429 になることを2026-07-01に確認。Opusは claude CLI サブプロセス経由
// （lib/claudeCli.ts）でのみ動作確認済み。詳細は .claude/rules/anthropic-model.md。
const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429 },
    );
  }

  let client: ReturnType<typeof createAnthropicClient>;
  try {
    client = createAnthropicClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
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
    ? body.seenQuestions.filter((q) => typeof q === "string").slice(0, 60)
    : [];

  if (!DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "難易度が不正です。" }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokensForCount(count),
      messages: [
        { role: "user", content: buildQuizPrompt(difficulty, category, count, seenQuestions) },
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
