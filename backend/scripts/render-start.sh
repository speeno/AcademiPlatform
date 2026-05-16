#!/usr/bin/env bash
set -euo pipefail

echo "==> [render-start] NODE_ENV=${NODE_ENV:-unset}"
echo "==> [render-start] PORT=${PORT:-unset}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Render PostgreSQL > Connections > Internal Database URL 을 Web Service 환경변수에 넣어주세요."
  exit 1
fi

echo "==> [render-start] Running prisma migrate deploy..."
npx prisma migrate deploy

if [[ "${RUN_DB_SEED:-false}" == "true" ]]; then
  echo "==> [render-start] RUN_DB_SEED=true, running prisma db seed..."
  npx prisma db seed
else
  echo "==> [render-start] Skipping seed (set RUN_DB_SEED=true for first deploy only)."
fi

echo "==> [render-start] Starting NestJS (dist/src/main.js)..."
exec node dist/src/main.js
