// サブパス配信時の接頭辞。next.config.mjs の basePath と一致させる。
// Next は basePath を <Link> 等には自動付与するが、fetch() には付与しないため
// API 呼び出しは必ずこのヘルパーを通す。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// API ルートなどへの絶対パスを basePath 付きで組み立てる
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
