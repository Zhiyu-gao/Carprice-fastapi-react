#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="Vehicle Intelligence Platform"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
DEPLOY_HOST="${DEPLOY_HOST:-127.0.0.1}"

echo "=========================================="
echo " Deploying ${PROJECT_NAME}"
echo " compose file: ${COMPOSE_FILE}"
echo "=========================================="

if [[ -f ".env" ]]; then
  qdrant_url="$(grep -E '^QDRANT_URL=' .env | tail -n1 | cut -d= -f2- || true)"
  if [[ "${qdrant_url}" == *"127.0.0.1"* || "${qdrant_url}" == *"localhost"* ]]; then
    echo "[WARN] QDRANT_URL in .env is '${qdrant_url}'"
    echo "       For docker-compose deployment, use: QDRANT_URL=http://qdrant:6333"
  fi
fi

echo "[1/5] Pull latest code"
git pull --ff-only

echo "[2/5] Validate compose"
docker compose -f "${COMPOSE_FILE}" config >/dev/null

echo "[3/5] Recreate services"
docker compose -f "${COMPOSE_FILE}" down
docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans

echo "[4/5] Current container status"
docker compose -f "${COMPOSE_FILE}" ps

echo "[5/5] Health checks"
check_url() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 10 "$url" >/dev/null; then
    echo "  [OK] ${name}: ${url}"
  else
    echo "  [WARN] ${name} not ready: ${url}"
  fi
}

sleep 5
check_url "Backend" "http://${DEPLOY_HOST}:8000/metrics"
check_url "AI Service" "http://${DEPLOY_HOST}:8080/metrics"
check_url "Frontend" "http://${DEPLOY_HOST}/"
check_url "Prometheus" "http://${DEPLOY_HOST}:9090/-/healthy"
check_url "Grafana" "http://${DEPLOY_HOST}:3000/api/health"

echo "=========================================="
echo " Deployment completed"
echo "=========================================="
