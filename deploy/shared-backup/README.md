# ~/deploy・~/.claude/hooks のバックアップ

`~/deploy/` と `~/.claude/` はどの git リポジトリにも属さないため、auto-stage / auto-push hook の対象外で自動コミットされない。
過去に一度この理由で `~/deploy/auto-deploy.sh` が失われ、onepiece / briefing-bot / marumie-jp 全アプリのデプロイが止まった。

再発防止のため、このディレクトリにコピーを置いている。`~/deploy/auto-deploy.sh` が消えていたら:

```bash
cp /home/w00dst0ck/apps/one-piece/deploy/shared-backup/auto-deploy.sh /home/w00dst0ck/deploy/auto-deploy.sh
chmod +x /home/w00dst0ck/deploy/auto-deploy.sh
```

`~/.claude/hooks/*.sh` や `~/.claude/settings.json` が消えていたら `claude-hooks/` から復元:

```bash
cp /home/w00dst0ck/apps/one-piece/deploy/shared-backup/claude-hooks/*.sh /home/w00dst0ck/.claude/hooks/
chmod +x /home/w00dst0ck/.claude/hooks/*.sh
cp /home/w00dst0ck/apps/one-piece/deploy/shared-backup/claude-hooks/settings.json.bak /home/w00dst0ck/.claude/settings.json
```
