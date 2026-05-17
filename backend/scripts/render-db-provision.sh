#!/usr/bin/env bash
# 신규 Render PostgreSQL에 스키마·시드 적용 (로컬 또는 CI)
#
# 사용법 (External Database URL 권장):
#   export DATABASE_URL='postgresql://academiqdb_09uu_user:PASSWORD@dpg-....oregon-postgres.render.com:5432/academiqdb_09uu?sslmode=require'
#   cd backend && ./scripts/render-db-provision.sh
#
# Web Service 첫 배포 시에는 대신 RUN_DB_SEED=true 로 deploy 해도 됩니다.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Render PostgreSQL > Connections > External Database URL 을 export 한 뒤 다시 실행하세요."
  exit 1
fi

if [[ "${DATABASE_URL}" != *"sslmode="* ]]; then
  if [[ "${DATABASE_URL}" == *"?"* ]]; then
    export DATABASE_URL="${DATABASE_URL}&sslmode=require"
  else
    export DATABASE_URL="${DATABASE_URL}?sslmode=require"
  fi
  echo "==> Appended sslmode=require to DATABASE_URL"
fi

echo "==> prisma migrate deploy..."
npx prisma migrate deploy

echo "==> prisma db seed..."
npx prisma db seed

echo "==> Done. Render Web Service의 DATABASE_URL은 Internal URL 로 설정하세요."
