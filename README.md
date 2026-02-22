# Vehicle Intelligence Platform

A full-stack platform for used-car data crawling, annotation, model prediction, AI assistant (multi-LLM), and operations monitoring.

## Stack
- Frontend: React + Vite + Ant Design
- Backend: FastAPI + SQLAlchemy + MySQL + Playwright + scikit-learn
- AI Service: FastAPI + Kimi/Qwen/DeepSeek + RAG + MCP
- Infra: Redis + Qdrant + ClickHouse + Prometheus + Grafana + Nginx

## Repository Layout
- `frontend/`: Web UI
- `mobile2/`: Mobile web build (Expo Router export)
- `backend/`: Core business APIs
- `ai_service/`: AI chat, RAG, MCP
- `nginx/`: reverse proxy config
- `observability/`: Prometheus + Grafana config
- `docker-compose.yml`: full deployment stack
- `docker-compose.infra.yml`: infra-only stack

## Architecture
- Frontend calls Backend for auth, data, crawler tasks, prediction, admin APIs.
- Frontend calls AI Service for chat/RAG/MCP.
- AI Service validates JWT with the same `SECRET_KEY` as Backend.
- AI Service MCP tools call Backend APIs.

## 1) Local Development

### Backend
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### AI Service
```bash
cd ai_service
uv sync
uv run uvicorn app.main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Optional Infra for local
```bash
docker compose -f docker-compose.infra.yml up -d
```

## 2) Deployment with Docker Compose

### Step A: Prepare env files
1. Copy root env:
```bash
cp .env.example .env
```
2. Update secrets and passwords in `.env`.
3. Confirm service env files:
- `backend/.env`
- `ai_service/.env`
- `frontend/.env` (for local Vite only)
- `mobile2/.env` (for local Expo only)

### Step B: Build and run full stack
```bash
docker compose up -d --build
```

### Step C: Validate
```bash
docker compose ps
curl -f http://127.0.0.1:8000/metrics
curl -f http://127.0.0.1:8080/metrics
curl -f http://127.0.0.1:9090/-/healthy
curl -f http://127.0.0.1:3000/api/health
```

### Step D: One-command deploy script
```bash
chmod +x deploy.sh
./deploy.sh
```
Optional:
```bash
DEPLOY_HOST=<your-server-ip> ./deploy.sh
COMPOSE_FILE=docker-compose.yml ./deploy.sh
```

## 3) Docker Notes

### Full stack (`docker-compose.yml`)
- Includes nginx, mysql, redis, qdrant, clickhouse, backend, ai_service, frontend, frontend_mobile, prometheus, grafana.
- Uses healthchecks and startup dependencies (`depends_on.condition`) to reduce boot race issues.
- Persists data in docker volumes and bind mounts:
  - `mysql_data`, `qdrant_data`, `clickhouse_data`, `prometheus_data`, `grafana_data`
  - `./backend/data:/app/data`
  - `./ai_service/data:/app/data`

### Infra-only (`docker-compose.infra.yml`)
- Starts Qdrant, ClickHouse, Prometheus, Grafana, node_exporter, cadvisor.
- Suitable when Backend/AI run directly on host.

## 4) Important Environment Variables

### Root `.env` (used by compose)
- `SECRET_KEY`, `ALGORITHM`
- `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`
- `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DB`
- `OSS_*`
- `BACKEND_API_BASE_URL`, `QDRANT_URL`

### `backend/.env`
- Must match JWT settings used by AI Service:
  - `SECRET_KEY`
  - `ALGORITHM`

### `ai_service/.env`
- LLM provider config: `KIMI_*`, `QWEN_*`, `DEEPSEEK_*`
- RAG config: `QDRANT_*`, `RAG_EMBEDDING_*`
- JWT config must match backend.

## 5) Nginx and TLS
- Nginx config is in `nginx/conf.d/default.conf`.
- Current config expects cert files under:
  - `nginx/cert/live/nrydawang.shop/fullchain.pem`
  - `nginx/cert/live/nrydawang.shop/privkey.pem`
- If deploying to another domain, update `server_name` and cert paths accordingly.

## 6) Monitoring
- Prometheus: `http://<host>:9090`
- Grafana: `http://<host>:3000` (`admin/admin` by default; change in production)

## 7) Quality Checks
```bash
make check
make format
```
See `CODE_QUALITY.md` for details.

## 8) Crawler Cookie JSON (Manual Login)
- Script path: `backend/app/scripts/create_cookie_json.py`
- Default output file: `backend/data/crawl/cookies/dongchedi_storage_state.json`

Run:
```bash
cd backend
uv run python -m app.scripts.create_cookie_json
```

After browser opens, manually log in to Dongchedi, then press Enter in terminal to save JSON.

In the crawler task UI:
- Turn on `启用 JSON Cookie 文件`
- Optional: set custom JSON path (`cookie_json_path`)
- If left empty, backend uses default path above.

## 9) Common Deployment Pitfalls
- JWT mismatch between Backend and AI Service (`SECRET_KEY`/`ALGORITHM`).
- Missing TLS cert files for Nginx 443 config.
- AI embedding API key missing (`RAG_EMBEDDING_API_KEY` or `QWEN_API_KEY`).
- DNS/domain not matching nginx `server_name`.
