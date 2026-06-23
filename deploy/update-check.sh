#!/usr/bin/env bash
exec "$HOME/deploy/auto-deploy.sh" \
  "onepiece" \
  "$HOME/apps/one-piece" \
  "onepiece" \
  "npm ci && NEXT_BASE_PATH=/onepiece npm run build" \
  "http://210.131.212.62/onepiece"
