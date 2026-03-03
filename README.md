# Vehicle Intelligence Platform

A full-stack platform for used-car data collection, labeling, prediction, AI analysis, and operational monitoring.

## Project Overview

### Core capabilities
- Vehicle data crawling and task orchestration
- Human-in-the-loop price annotation
- Price prediction and AI explanation
- User auth, forum, and direct messaging
- Large-screen analytics dashboard
- Observability with Prometheus + Grafana

### Tech stack
- `frontend/`: React 19 + Vite + Ant Design + ECharts/Recharts
- `mobile2/`: Expo Router (web/mobile runtime)
- `backend/`: FastAPI + SQLAlchemy + Alembic + MySQL + Redis
- `ai_service/`: FastAPI + multi-LLM routing + RAG (Qdrant)
- Infra: Nginx, ClickHouse, Prometheus, Grafana, cAdvisor, node_exporter

## Repository Structure

```text
.
├── frontend/               # Web application
├── mobile2/                # Expo application
├── backend/                # Main business API service
├── ai_service/             # AI chat/RAG/analysis service
├── nginx/                  # Reverse proxy and TLS config
├── observability/          # Prometheus + Grafana provisioning
├── scripts/quality/        # Unified quality scripts
├── docker-compose.yml      # Full-stack deployment
├── docker-compose.infra.yml# Infra-only deployment
├── Makefile                # Root quality commands
└── README.md
```

## Installation

### Prerequisites
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and npm
- Docker + Docker Compose (for containerized or infra mode)

### 1) Clone and bootstrap

```bash
git clone <your-repo-url>
cd Vehicle-Intelligence-Platform
cp .env.example .env
```

### 2) Install service dependencies

```bash
# backend
uv sync --project backend --group dev

# ai_service
uv sync --project ai_service --group dev

# frontend
npm --prefix frontend install

# mobile2
npm --prefix mobile2 install
```

## Usage

### Option A: Local development (recommended for coding)

1. Start infra dependencies (optional but recommended):

```bash
docker compose -f docker-compose.infra.yml up -d
```

2. Start backend:

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

3. Start AI service:

```bash
cd ai_service
uv run uvicorn app.main:app --reload --port 8080
```

4. Start frontend:

```bash
cd frontend
npm run dev
```

### Option B: Full Docker deployment

```bash
docker compose up -d --build
```

For production update on a server, use a single compose file flow:

```bash
bash deploy.sh
```

`deploy.sh` defaults to `docker-compose.yml`. Keep `QDRANT_URL=http://qdrant:6333` in root `.env`.

### Access points
- Frontend (via Nginx): `http://localhost`
- Backend API: `http://localhost:8000`
- AI service: `http://localhost:8080`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (default `admin/admin`)

## Usage Examples

### Check service health

```bash
curl -f http://127.0.0.1:8000/metrics
curl -f http://127.0.0.1:8080/metrics
curl -f http://127.0.0.1:9090/-/healthy
curl -f http://127.0.0.1:3000/api/health
```

### Run project-wide quality checks

```bash
make format
make check
```

### Generate crawler cookie JSON (manual login flow)

```bash
cd backend
uv run python -m app.scripts.create_cookie_json
```

Default output:
- `backend/data/crawl/cookies/dongchedi_storage_state.json`

## Configuration Guidelines

### Root `.env` (compose-level)
Key variables include:
- `SECRET_KEY`, `ALGORITHM`
- `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`
- `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DB`
- `OSS_ENABLED`, `OSS_AUTH_MODE`, `OSS_BUCKET`, `OSS_ENDPOINT`, `OSS_PREFIX`
- `BACKEND_API_BASE_URL`, `QDRANT_URL`
- In docker-compose deployment, root `.env` is the source of truth for shared vars.

### Service env alignment
- `backend/.env` and `ai_service/.env` must use the same JWT settings:
  - `SECRET_KEY`
  - `ALGORITHM`
- AI provider keys should be configured in `ai_service/.env` (`KIMI_*`, `QWEN_*`, `DEEPSEEK_*`).
- `backend/.env` and `ai_service/.env` are mainly for service-local settings/overrides in local runs.

### Nginx/TLS notes
- Active config: `nginx/conf.d/default.conf`
- If deploying your own domain, update `server_name` and certificate paths in Nginx config.

## Contribution Guidelines

1. Create a branch from `main`.
2. Keep changes focused and atomic.
3. Run formatting and checks before opening a PR:

```bash
make format
make check
```

4. Add or update tests when behavior changes.
5. Include migration notes for schema/config changes.
6. Use clear commit messages and describe verification steps in PR description.

## Troubleshooting

### 1) `401` between frontend/backend/ai service
- Verify token exists in frontend storage.
- Ensure `SECRET_KEY` and `ALGORITHM` match in backend and ai service env files.

### 2) AI features unavailable
- Check AI provider keys in `ai_service/.env`.
- Verify Qdrant is reachable (`QDRANT_URL`).

### 3) Crawler tasks fail immediately
- Confirm cookie JSON path exists and file is valid.
- Verify crawler city code mapping and network reachability.

### 4) Nginx HTTPS startup failure
- Recheck certificate paths mounted under `nginx/cert`.
- Validate config with `nginx -t` in container.

### 5) Database connection errors
- Confirm MySQL and ClickHouse containers are healthy.
- Recheck DB credentials in `.env` and service env files.

## Quality and Standards

- Formatting and static checks are centralized under `scripts/quality/`.
- Root commands:
  - `make format`
  - `make check`
  - `make check-python`
  - `make check-web`
  - `make check-types`

For more detail, see [`CODE_QUALITY.md`](./CODE_QUALITY.md).
