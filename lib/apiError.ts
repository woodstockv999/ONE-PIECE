import Anthropic from "@anthropic-ai/sdk";

export function errStatus(err: unknown): number {
  if (err instanceof Anthropic.APIError && typeof err.status === "number") {
    return err.status;
  }
  return 500;
}

// Anthropic の API エラーをユーザー向けの分かりやすい日本語メッセージに変換
export function toUserMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "認証に失敗しました。`claude login` を再実行してトークンを更新するか、ANTHROPIC_API_KEY を確認してください。";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "アクセス権限がありません。サブスクリプションの有効期限または利用制限をご確認ください。";
  }
  if (err instanceof Anthropic.RateLimitError) {
    // Claude.ai の「使用量」(月次メッセージ数) とは別に、API には分間リクエスト数の制限があります。
    // 使用量が残っていても、短時間に多くのリクエストを送ると 429 が返ることがあります。
    return "APIのリクエスト数制限に達しました（Claude.aiの使用量とは別の制限です）。1〜2分待ってから再度お試しください。";
  }
  if (err instanceof Anthropic.APIError) {
    if (err.status === 400 || err.status === 403) {
      return "リクエストに失敗しました。APIのクレジット残高やキー設定をご確認ください。";
    }
    if (typeof err.status === "number" && err.status >= 500) {
      return "Anthropic API が一時的に応答していません。しばらく待って再度お試しください。";
    }
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "通信に失敗しました。ネットワークを確認してください。";
  }
  return "予期しないエラーが発生しました。もう一度お試しください。";
}
