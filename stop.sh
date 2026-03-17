#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  AcademiQ — 개발 서버 종료 스크립트
#  사용법: ./stop.sh [--all]
#    --all : PostgreSQL, Redis 포함 종료 (Homebrew 서비스)
# ─────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT_DIR/.pids"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }

# ── PID 파일로 프로세스 종료 ──────────────────────────────────
stop_process() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  if [[ ! -f "$pid_file" ]]; then
    warn "$name: PID 파일 없음 (이미 종료되었거나 시작되지 않음)"
    return
  fi

  local pid
  pid=$(cat "$pid_file")

  if kill -0 "$pid" 2>/dev/null; then
    info "$name 종료 중 (PID: $pid)..."

    # 자식 프로세스까지 포함하여 종료
    pkill -TERM -P "$pid" 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null || true

    # 최대 10초 대기
    local attempts=0
    while kill -0 "$pid" 2>/dev/null; do
      sleep 1
      (( attempts++ ))
      if (( attempts >= 10 )); then
        warn "$name 강제 종료 (SIGKILL)..."
        pkill -KILL -P "$pid" 2>/dev/null || true
        kill -KILL "$pid" 2>/dev/null || true
        break
      fi
    done

    log "$name 종료 완료"
  else
    warn "$name: 프로세스가 이미 종료됨 (PID: $pid)"
  fi

  rm -f "$pid_file"
}

# ── 포트로 프로세스 종료 (PID 파일 없을 때 보조 수단) ─────────
stop_by_port() {
  local port="$1"
  local name="$2"
  local pid
  pid=$(lsof -ti tcp:"$port" 2>/dev/null | head -1)

  if [[ -n "$pid" ]]; then
    info "포트 $port 점유 프로세스 종료 중 (PID: $pid)..."
    kill -TERM "$pid" 2>/dev/null || true
    sleep 2
    kill -KILL "$pid" 2>/dev/null || true
    log "$name (포트 $port) 종료 완료"
  fi
}

# ── 메인 ──────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     AcademiQ 개발 서버 종료          ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

stop_process "backend"
stop_process "frontend"

# PID 파일이 없는 경우 포트 기반 종료 시도
stop_by_port 4400 "백엔드"
stop_by_port 3300 "프론트엔드"

# Homebrew 서비스 종료 옵션 (--all 플래그 사용 시)
if [[ "$1" == "--all" ]]; then
  echo ""
  info "PostgreSQL 종료 중..."
  brew services stop postgresql@16 && log "PostgreSQL 종료 완료" || warn "PostgreSQL 종료 실패"

  info "Redis 종료 중..."
  brew services stop redis && log "Redis 종료 완료" || warn "Redis 종료 실패"
fi

# .pids 디렉토리 정리
rm -rf "$PID_DIR"

echo ""
log "모든 서버 종료 완료"
echo ""
