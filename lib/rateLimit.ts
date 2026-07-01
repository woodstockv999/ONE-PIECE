// 単一プロセス(pm2)向けの簡易インメモリ・レートリミッタ。
// 公開APIで Claude(共有OAuthトークン)/Gemini を呼ぶため、
// bot等の連打によるクォータ枯渇を防ぐのが目的（Redis等は不要な規模）。

const WINDOW_MS = 60_000; // 1分の固定ウィンドウ
const MAX_REQUESTS = 10; // 1分あたりの上限（通常の対話利用は妨げず、連打だけ弾く）

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

// メモリリーク防止のため、古いバケットを間引く
function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

/**
 * IPごとのレート制限をチェックする。
 * @returns 許可される場合 true、超過している場合 false
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    if (buckets.size > 1000) cleanup(now);
    return true;
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/**
 * nginx の proxy_pass 経由を想定しクライアントIPを取得。
 * X-Forwarded-For はクライアントが任意の値を送れて偽装可能なため、
 * nginx が $remote_addr で上書き設定している X-Real-IP を優先する。
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}
