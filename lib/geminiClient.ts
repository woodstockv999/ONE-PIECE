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

// 503（高負荷）は短い間隔でリトライ、429（レートリミット）はリトライせず即座にエラーを返す
export async function generateWithRetry(
  ai: GoogleGenAI,
  model: string,
  contents: string,
  tools?: object[],
  maxRetries = 3,
  delayMs = 6000,
  callTimeoutMs = 25000,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents,
        config: {
          ...(tools ? { tools } : {}),
          temperature: 1.8,
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), callTimeoutMs),
      );
      const response = await Promise.race([callPromise, timeoutPromise]);
      return response.text ?? "";
    } catch (err: unknown) {
      lastError = err;
      const msg = String((err as { message?: string })?.message ?? "");
      const is503 = msg.includes('"code":503') || msg.includes("UNAVAILABLE");

      if (is503) {
        if (attempt >= maxRetries) break;
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        break;
      }
    }
  }
  throw lastError;
}
