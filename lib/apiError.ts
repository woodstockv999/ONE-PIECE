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
    return "APIキーが無効です。Anthropic Console のキーを確認してください。";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "APIキーの権限が不足しています。";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "レート制限に達しました。しばらく待って再度お試しください。";
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
