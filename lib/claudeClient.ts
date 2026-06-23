import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface StoredCredentials {
  claudeAiOauth?: {
    accessToken?: string;
    expiresAt?: number;
  };
}

// claude CLI が ~/.claude/.credentials.json に保存した OAuth トークンを読む。
// トークンが見つからない場合は ANTHROPIC_API_KEY にフォールバックする。
export function createAnthropicClient(): Anthropic {
  let oauthTokenExpired = false;

  try {
    const credPath = join(homedir(), ".claude", ".credentials.json");
    const creds: StoredCredentials = JSON.parse(readFileSync(credPath, "utf-8"));
    const token = creds?.claudeAiOauth?.accessToken;
    const expiresAt = creds?.claudeAiOauth?.expiresAt;

    if (token) {
      // expiresAt は秒またはミリ秒のどちらの場合もある（1e11 未満なら秒として扱う）
      const expiresAtMs =
        expiresAt != null ? (expiresAt < 1e11 ? expiresAt * 1000 : expiresAt) : null;
      const isExpired = expiresAtMs != null && Date.now() >= expiresAtMs;

      if (isExpired) {
        oauthTokenExpired = true;
        // 期限切れの場合は ANTHROPIC_API_KEY へフォールバック
      } else {
        return new Anthropic({ authToken: token });
      }
    }
  } catch {
    // ファイルなし・パースエラーはスキップして次の方法を試す
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new Anthropic({ apiKey });
  }

  throw new Error(
    oauthTokenExpired
      ? "OAuthトークンの有効期限が切れています。`claude login` を再実行してトークンを更新してください。"
      : "認証情報が見つかりません。claude CLI でログイン済みか確認するか、ANTHROPIC_API_KEY を設定してください。",
  );
}
