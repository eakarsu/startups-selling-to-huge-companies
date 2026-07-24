#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3014}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
DB_NAME="${PGDATABASE:-enterprise_crm_db}"

cd "$PROJECT_DIR"

if [ "${SKIP_PROJECT_ENV:-false}" != "true" ] && [ -f .env ]; then
  set -a
  source .env
  set +a
fi

for dependency_dir in backend/node_modules frontend/node_modules; do
  [ -d "$dependency_dir" ] || {
    echo "Error: $dependency_dir is missing; install dependencies in an explicit bootstrap step." >&2
    exit 1
  }
done

for name in DATABASE_URL JWT_SECRET PROVISION_ADMIN_EMAIL PROVISION_ADMIN_PASSWORD OPENROUTER_API_KEY OPENROUTER_MODEL OPENROUTER_BASE_URL; do
  [ -n "${!name:-}" ] || { echo "Error: $name is required." >&2; exit 1; }
done
[ "$OPENROUTER_BASE_URL" = "https://openrouter.ai/api/v1" ] || { echo "Error: OPENROUTER_BASE_URL must be canonical." >&2; exit 1; }

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Error: port $port is occupied; refusing to terminate another process." >&2
    exit 1
  fi
done

npm --prefix backend run migrate
node backend/scripts/provision-runtime-admin.js

(cd backend && exec env HOST="$BACKEND_HOST" PORT="$BACKEND_PORT" PGDATABASE="$DB_NAME" node server.js) &
backend_pid=$!
(cd frontend && exec ./node_modules/.bin/vite --host "$FRONTEND_HOST" --port "$FRONTEND_PORT") &
frontend_pid=$!

cleanup() {
  kill -TERM "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "EnterpriseOS backend: http://$BACKEND_HOST:$BACKEND_PORT"
echo "EnterpriseOS frontend: http://$FRONTEND_HOST:$FRONTEND_PORT"
wait
