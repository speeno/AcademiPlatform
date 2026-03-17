#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  AcademiQ — 개발 서버 시작 스크립트
#  사용법: ./start.sh [--no-frontend]
# ─────────────────────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✘]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $1"; }

# ── 이미 실행 중인지 확인 ──────────────────────────────────────
is_running() {
  local pid_file="$PID_DIR/$1.pid"
  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

# ── PostgreSQL 상태 확인 ───────────────────────────────────────
check_postgres() {
  if psql -U postgres -d academiq -c "SELECT 1;" &>/dev/null; then
    log "PostgreSQL(academiq DB) 연결 확인"
  else
    warn "PostgreSQL에 연결할 수 없습니다."
    info "brew services start postgresql@16 으로 시작해 주세요."
    fail "PostgreSQL 연결 실패"
  fi
}

# ── Redis 상태 확인 ────────────────────────────────────────────
check_redis() {
  if redis-cli ping &>/dev/null; then
    log "Redis 연결 확인"
  else
    warn "Redis에 연결할 수 없습니다."
    info "brew services start redis 으로 시작해 주세요."
    fail "Redis 연결 실패"
  fi
}

# ── 백엔드 시작 ────────────────────────────────────────────────
start_backend() {
  if is_running "backend"; then
    warn "백엔드가 이미 실행 중입니다 (PID: $(cat "$PID_DIR/backend.pid"))"
    return
  fi

  info "백엔드 시작 중..."
  cd "$ROOT_DIR/backend"

  # Prisma 클라이언트 생성
  npx prisma generate &>/dev/null

  nohup npm run start:dev \
    > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$PID_DIR/backend.pid"

  # 포트가 열릴 때까지 대기 (최대 60초)
  local attempts=0
  info "포트 4400 응답 대기 중..."
  while ! lsof -ti tcp:4400 &>/dev/null; do
    sleep 1
    (( attempts++ ))
    printf "."
    if (( attempts >= 60 )); then
      echo ""
      warn "백엔드 시작 시간 초과. 로그를 확인해 주세요: logs/backend.log"
      return
    fi
  done
  echo ""

  log "백엔드 실행 중: http://localhost:4400/api"
}

# ── 프론트엔드 시작 ───────────────────────────────────────────
start_frontend() {
  if is_running "frontend"; then
    warn "프론트엔드가 이미 실행 중입니다 (PID: $(cat "$PID_DIR/frontend.pid"))"
    return
  fi

  info "프론트엔드 시작 중..."
  cd "$ROOT_DIR/frontend"

  nohup npm run dev \
    > "$LOG_DIR/frontend.log" 2>&1 &
  echo $! > "$PID_DIR/frontend.pid"

  # 포트가 열릴 때까지 대기 (최대 60초)
  local attempts=0
  info "포트 3300 응답 대기 중..."
  while ! lsof -ti tcp:3300 &>/dev/null; do
    sleep 1
    (( attempts++ ))
    printf "."
    if (( attempts >= 60 )); then
      echo ""
      warn "프론트엔드 시작 시간 초과. 로그를 확인해 주세요: logs/frontend.log"
      return
    fi
  done
  echo ""

  log "프론트엔드 실행 중: http://localhost:3300"
}

# ── 메인 ──────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     AcademiQ 개발 서버 시작          ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

check_postgres
check_redis

start_backend

if [[ "$1" != "--no-frontend" ]]; then
  start_frontend
fi

echo ""
echo "  ┌──────────────────────────────────────┐"
echo "  │  프론트엔드: http://localhost:3300    │"
echo "  │  백엔드 API: http://localhost:4400    │"
echo "  │  로그 위치:  ./logs/                  │"
echo "  │  종료 방법: ./stop.sh                 │"
echo "  └──────────────────────────────────────┘"
echo ""
