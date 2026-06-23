import { GoogleGenAI } from "@google/genai";

export function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。.env.local に設定してください。",
    );
  }
  return new GoogleGenAI({ apiKey });
}

function parseRetryDelay(msg: string): number {
  // "retryDelay":"29s" または "retryDelay":"29.123456789s" のような形式をパース
  const m = msg.match(/"retryDelay"\s*:\s*"([\d.]+)s"/);
  if (m) return Math.ceil(parseFloat(m[1])) * 1000 + 1000; // 1秒バッファ追加
  return 35000; // デフォルト35秒
}

// 503（高負荷）は短い間隔でリトライ、429（レートリミット）はAPIが示す待機時間で1回リトライ
export async function generateWithRetry(
  ai: GoogleGenAI,
  model: string,
  contents: string,
  tools?: object[],
  maxRetries = 7,
  delayMs = 6000,
): Promise<string> {
  let lastError: unknown;
  let rateLimitRetried = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        ...(tools ? { config: { tools } } : {}),
      });
      return response.text ?? "";
    } catch (err: unknown) {
      lastError = err;
      const msg = String((err as { message?: string })?.message ?? "");
      const is503 = msg.includes('"code":503') || msg.includes("UNAVAILABLE");
      const is429 = msg.includes('"code":429') || msg.includes("RESOURCE_EXHAUSTED");

      if (is503) {
        if (attempt >= maxRetries) break;
        await new Promise((r) => setTimeout(r, delayMs));
      } else if (is429 && !rateLimitRetried) {
        rateLimitRetried = true;
        const wait = parseRetryDelay(msg);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        break;
      }
    }
  }
  throw lastError;
}
