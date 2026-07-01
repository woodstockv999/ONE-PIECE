// PM2 設定。briefing-bot(3000)・marumie-jp(3002) と衝突しないよう 3001 を使用。
// これまでは PORT=3001 が pm2 の保存済み環境変数にのみ存在し、どのファイルにも
// 明記されていなかったため、素の `pm2 start npm -- start` 等で作り直すと
// デフォルトの3000（briefing-botと衝突）で起動してしまう危険があった。
// 起動: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: "onepiece",
      cwd: "/home/w00dst0ck/apps/one-piece",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};
