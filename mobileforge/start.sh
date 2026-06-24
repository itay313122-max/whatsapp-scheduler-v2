#!/usr/bin/env bash
#
# MobileForge — one-command local launcher.
#   ./start.sh           start backend (:4000) + frontend (:3000)
#   ./start.sh --check   only run the AI provider health check, then exit
#
# Installs dependencies on first run, then starts both servers and tails their
# logs. Press Ctrl+C to stop everything cleanly.

set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
say() { echo -e "${BLUE}▸${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}!${NC} $*"; }

# ── Pre-flight ───────────────────────────────────────────────────────────────
command -v node >/dev/null || { echo -e "${RED}✗ Node.js not found. Install Node 18+ first.${NC}"; exit 1; }
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || warn "Node $NODE_MAJOR detected — Node 18+ recommended."

if [ ! -f backend/.env ]; then
  warn "backend/.env not found — copying from .env.example (add your API keys to it)."
  cp backend/.env.example backend/.env
fi
if [ ! -f frontend/.env.local ]; then
  warn "frontend/.env.local not found — copying from example."
  cp frontend/.env.local.example frontend/.env.local 2>/dev/null || true
fi

# ── AI health check ──────────────────────────────────────────────────────────
say "Checking AI providers…"
( cd backend && node ../check-ai.mjs ) || warn "No live AI provider — app will run in demo mode (still works)."

if [ "${1:-}" = "--check" ]; then exit 0; fi

# ── Install deps if missing ──────────────────────────────────────────────────
if [ ! -d backend/node_modules ];  then say "Installing backend deps…";  ( cd backend && npm install ); fi
if [ ! -d frontend/node_modules ]; then say "Installing frontend deps…"; ( cd frontend && npm install ); fi

# ── Launch both servers ──────────────────────────────────────────────────────
PIDS=()
cleanup() { echo; say "Shutting down…"; for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done; exit 0; }
trap cleanup INT TERM

say "Starting backend on http://localhost:4000 …"
( cd backend && npm run dev ) & PIDS+=($!)

say "Starting frontend on http://localhost:3000 …"
( cd frontend && npm run dev ) & PIDS+=($!)

sleep 2
echo
ok "MobileForge is starting up."
echo -e "   ${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "   ${GREEN}Backend: ${NC} http://localhost:4000"
echo -e "   ${YELLOW}Press Ctrl+C to stop both.${NC}"
echo

wait
