#!/usr/bin/env bash
set -euo pipefail

echo "==> [render-start] NODE_ENV=${NODE_ENV:-unset}"
echo "==> [render-start] PORT=${PORT:-unset}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Render PostgreSQL > Connections > Internal Database URL 을 Web Service 환경변수에 넣어주세요."
  exit 1
fi

for key in JWT_SECRET JWT_REFRESH_SECRET; do
  if [[ -z "${!key:-}" ]]; then
    echo "ERROR: ${key} is not set."
    echo "Render Web Service > Environment 에 JWT 시크릿을 설정하세요."
    exit 1
  fi
done

if [[ "${DATABASE_URL}" != *"sslmode="* ]]; then
  if [[ "${DATABASE_URL}" == *"?"* ]]; then
    export DATABASE_URL="${DATABASE_URL}&sslmode=require"
  else
    export DATABASE_URL="${DATABASE_URL}?sslmode=require"
  fi
  echo "==> [render-start] Appended sslmode=require to DATABASE_URL"
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
