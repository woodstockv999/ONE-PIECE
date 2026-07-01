import { spawn } from "node:child_process";

// ─────────────────────────────────────────────────────────────
//  端末の `claude` を headless（-p）モードで起動し、
//  Claude Pro/Max サブスクリプション認証 + WebSearch ツールで
//  最新情報を検索しながら生成する（API キー従量課金なし）。
//  Anthropic API の web_search ツールは OAuth では使えない（429になる）ため、
//  Claude Code CLI 自体の WebSearch ツールを利用する。
//  速度優先のため Haiku + WebSearch のみ（WebFetchでの話数裏取りは
//  精度は上がるが count=5 で90〜100秒台までかかり不安定だったため撤回）。
// ─────────────────────────────────────────────────────────────

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";
const TIMEOUT_MS = Number(process.env.CLAUDE_CLI_TIMEOUT_MS || 55_000);

export async function generateWithCliSearch(prompt: string): Promise<string> {
  const args = [
    "-p",
    "--output-format",
    "json",
    "--model",
    MODEL,
    "--allowedTools",
    "WebSearch",
  ];

  return await new Promise<string>((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("CLAUDE_CLI_TIMEOUT"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `claude CLI を起動できません（${CLAUDE_BIN}）。VPS に Claude Code をインストールしログイン済みか確認してください。詳細: ${err.message}`
        )
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `claude CLI が異常終了しました (exit ${code})。${stderr.slice(0, 500)}`
          )
        );
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        const text: string = parsed.result ?? parsed.text ?? parsed.content ?? "";
        if (parsed.is_error) {
          reject(new Error(`claude CLI エラー: ${text || "unknown"}`));
          return;
        }
        resolve(String(text).trim());
      } catch {
        resolve(stdout.trim());
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
