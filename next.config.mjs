/** @type {import('next').NextConfig} */

// サブパス配信（例: http://<host>/onepiece）に対応するための basePath。
// ポータル配下に複数アプリをぶら下げる構成のため、既定で "/onepiece"。
// ルート直下で動かしたい場合は NEXT_PUBLIC_BASE_PATH="" を渡す。
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH === undefined
    ? "/onepiece"
    : process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig = {
  reactStrictMode: true,
  // 空文字のときは basePath を無効化（Next は "" や "/" を許可しないため）
  ...(basePath ? { basePath } : {}),
  // クライアント側 fetch でも同じ接頭辞を使えるよう env として埋め込む
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
