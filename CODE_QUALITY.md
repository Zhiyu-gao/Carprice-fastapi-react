# Code Quality Guide

## Goals
- Keep style and static checks consistent across Python and TypeScript projects.
- Make quality checks runnable with one command from the repository root.

## Prerequisites
- Python + `uv`
- Node.js + npm
- Install Python dev dependencies:
  - `uv sync --project ai_service --group dev`
  - `uv sync --project backend --group dev`

## Root Commands
- `make check`: run lint/type checks for backend, ai_service, frontend, mobile2
- `make format`: run auto-format/fix across Python and frontend projects
- `make check-python`: Python checks only
- `make check-web`: frontend/mobile checks only
- `make check-types`: optional strict mypy checks (gradual adoption)

## Pre-commit
Install once in repo root:

```bash
pre-commit install
```

Then run on all files:

```bash
pre-commit run --all-files
```

## Quality Files
- `.editorconfig`: universal whitespace/newline/indentation rules
- `.pre-commit-config.yaml`: standard hooks + ruff hooks
- `backend/pyproject.toml`: backend ruff/mypy settings
- `ai_service/pyproject.toml`: ai service ruff/mypy settings
- `scripts/quality/check_all.sh`: all quality checks
- `scripts/quality/format_all.sh`: all formatting/fixes

## Frontend Rollout Strategy
- `npm --prefix frontend run lint` is the baseline gate (warnings allowed).
- `npm --prefix frontend run lint:strict` is the target gate for future cleanup (no warnings).
