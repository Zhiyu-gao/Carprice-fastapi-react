#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

run() {
  echo "\n==> $1"
  shift
  (cd "$ROOT_DIR" && "$@")
}

run "ai_service: ruff format + fix" uv run --project ai_service ruff format ai_service/app
run "ai_service: ruff fix" uv run --project ai_service ruff check --fix ai_service/app
run "backend: ruff format + fix" uv run --project backend ruff format backend/app
run "backend: ruff fix" uv run --project backend ruff check --fix backend/app
run "frontend: eslint --fix" npm --prefix frontend run lint:fix
run "mobile2: eslint --fix" npm --prefix mobile2 run lint:fix

echo "\nFormatting completed."
