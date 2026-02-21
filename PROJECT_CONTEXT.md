# Vehicle Intelligence Platform - Project Context

## 1. Project Positioning
This is a full-stack engineering project around used-car intelligence:
- data crawling
- annotation and training dataset
- price prediction
- AI assistant (multi-model + RAG + MCP)
- admin and observability

## 2. Core Services
- `frontend`: user/admin web app (React + Vite)
- `backend`: core API and business logic (FastAPI + MySQL)
- `ai_service`: AI chat service (FastAPI + RAG + MCP)

## 3. Runtime Flow
1. User logs in via `frontend`.
2. `frontend` calls `backend` for business APIs.
3. `frontend` calls `ai_service` for AI chat/RAG.
4. `ai_service` verifies JWT with backend-shared secret.
5. MCP tools in `ai_service` call `backend` for task/car lookup.

## 4. Data and Storage
### Backend
- MySQL: users, crawl cars, train cars, forum, messages
- Local files under `backend/data/`

### AI Service
- SQLite: `ai_service/data/chat.db`, `ai_service/data/rag/rag.db`
- Upload files: `ai_service/data/rag/uploads`
- Vector DB: Qdrant (container or local path)

## 5. Deployment Files
- `docker-compose.yml`: full production stack
- `docker-compose.infra.yml`: infra-only stack
- `deploy.sh`: one-command deployment helper
- `nginx/conf.d/default.conf`: reverse proxy + TLS + mobile routing

## 6. Deployment Requirements
- Docker + Docker Compose plugin
- Domain and TLS certificates if using HTTPS nginx config
- Valid env files:
  - root `.env` (compose variable source)
  - `backend/.env`
  - `ai_service/.env`

## 7. Deployment Checklist
1. Copy env template:
   - `cp .env.example .env`
2. Set production secrets/passwords.
3. Ensure backend and ai_service JWT settings are identical.
4. Ensure nginx cert files exist and domain config matches.
5. Run deployment:
   - `docker compose up -d --build`
   - or `./deploy.sh`
6. Verify service health:
   - backend: `:8000/metrics`
   - ai_service: `:8080/metrics`
   - prometheus: `:9090/-/healthy`
   - grafana: `:3000/api/health`

## 8. Operational Notes
- `docker-compose.yml` now includes healthchecks for key services.
- Service startup order uses dependency health conditions to reduce race failures.
- Backend and AI data directories are bind-mounted for persistence:
  - `./backend/data:/app/data`
  - `./ai_service/data:/app/data`

## 9. Known Technical Debt
- Frontend still has historical TypeScript `any` and hook warnings.
- Some historical naming still exists in old paths/scripts.
- Alembic migration discipline can be improved further.

## 10. Suggested Next Steps After Deployment
- Move all secrets to a managed secret store.
- Add CI pipeline for `make check` and image build smoke tests.
- Add backup strategy for MySQL and Qdrant volumes.
