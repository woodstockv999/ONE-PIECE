import { NextRequest, NextResponse } from "next/server";
import { buildExplainPrompt } from "@/lib/prompts";
import { extractText } from "@/lib/parse";
import { errStatus, toUserMessage } from "@/lib/apiError";
import { createAnthropicClient } from "@/lib/claudeClient";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// claude-opus-4-8 を試したが、この経路（Anthropic SDK直叩き + OAuthトークン）では
// 即 429 になることを2026-07-01に確認。Opusは claude CLI サブプロセス経由
// （lib/claudeCli.ts）でのみ動作確認済み。詳細は .claude/rules/anthropic-model.md。
const MODEL = "claude-haiku-4-5-20251001";

// 深掘り・解説モード（§4-7）
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

  let body: { topic?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const topic = (body.topic ?? "").toString().trim().slice(0, 100);
  if (!topic) {
    return NextResponse.json(
      { error: "深掘りするトピックを指定してください。" },
      { status: 400 },
    );
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: buildExplainPrompt(topic) }],
    });

    const text = extractText(response.content).trim();
    if (!text) {
      return NextResponse.json(
        { error: "解説の生成に失敗しました。もう一度お試しください。" },
        { status: 502 },
      );
    }

    return NextResponse.json({ explanation: text });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: toUserMessage(err) },
      { status: errStatus(err) },
    );
  }
}
