.PHONY: check format check-python check-web check-types

check:
	./scripts/quality/check_all.sh

format:
	./scripts/quality/format_all.sh

check-python:
	uv run --project ai_service ruff check ai_service/app
	uv run --project backend ruff check backend/app

check-web:
	npm --prefix frontend run lint
	npm --prefix frontend run typecheck
	npm --prefix mobile2 run lint
	npm --prefix mobile2 run typecheck

check-types:
	uv run --project ai_service mypy ai_service/app
	uv run --project backend mypy backend/app
