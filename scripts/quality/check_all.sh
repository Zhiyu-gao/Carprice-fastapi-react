#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

run() {
  echo "\n==> $1"
  shift
  (cd "$ROOT_DIR" && "$@")
}

run "ai_service: ruff" uv run --project ai_service ruff check ai_service/app
run "ai_service: py_compile" uv run --project ai_service python -m py_compile ai_service/app/main.py ai_service/app/chat.py ai_service/app/rag.py
run "backend: ruff" uv run --project backend ruff check backend/app
run "backend: py_compile" uv run --project backend python -m py_compile backend/app/main.py
run "frontend: lint" npm --prefix frontend run lint
run "frontend: typecheck" npm --prefix frontend run typecheck
run "mobile2: lint" npm --prefix mobile2 run lint
run "mobile2: typecheck" npm --prefix mobile2 run typecheck

echo "\nAll quality checks passed."
