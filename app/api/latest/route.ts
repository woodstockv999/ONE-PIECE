import { NextRequest, NextResponse } from "next/server";
import { buildLatestQuizPrompt, maxTokensForCount } from "@/lib/prompts";
import { extractText, parseQuiz } from "@/lib/parse";
import { errStatus, toUserMessage } from "@/lib/apiError";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";
import { createAnthropicClient } from "@/lib/claudeClient";

export const runtime = "nodejs";
// Web検索は数十秒かかるため長めに
export const maxDuration = 120;

// web_search ツールは Sonnet 4.6 以上が必要なため Sonnet を使用する。
// 最新話モードはユーザーが明示的にオンにする低頻度機能のため、
// Sonnet を使っても通常クイズ（Haiku）との競合は最小限に抑えられる。
const MODEL = "claude-sonnet-4-6";

// 最新話モード：Anthropic の web search ツールを併用（§3・§4-6）
export async function POST(req: NextRequest) {
  let client: ReturnType<typeof createAnthropicClient>;
  try {
    client = createAnthropicClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
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

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokensForCount(count),
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
          user_location: {
            type: "approximate",
            city: "Tokyo",
            region: "Tokyo",
            country: "JP",
            timezone: "Asia/Tokyo",
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildLatestQuizPrompt(difficulty, category, count),
        },
      ],
    });

    // content には text 以外のブロック（server_tool_use 等）が混ざるため
    // type === "text" でフィルタして連結する
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
