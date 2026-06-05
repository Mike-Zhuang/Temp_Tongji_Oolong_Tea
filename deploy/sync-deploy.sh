#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/tongji-oolong-tea
APP_NAME=tongji-oolong-tea
MAIN_REF=refs/heads/main
LOCK_FILE=/tmp/tongji-oolong-tea-sync.lock
NPM_REGISTRY=https://registry.npmmirror.com
NPM_FALLBACK_REGISTRY=https://registry.npmjs.org
CANDIDATES=(
  https://gh-proxy.com/https://github.com/Mike-Zhuang/Temp_Tongji_Oolong_Tea.git
  https://gitproxy.click/https://github.com/Mike-Zhuang/Temp_Tongji_Oolong_Tea.git
  https://github.com/Mike-Zhuang/Temp_Tongji_Oolong_Tea.git
)

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "[tongji-oolong-tea-sync] another deploy is running"; exit 0; }

pick_source() {
  local src hash
  for src in "${CANDIDATES[@]}"; do
    hash=$(timeout 25 git ls-remote "$src" "$MAIN_REF" 2>/dev/null | awk 'NR==1{print $1}')
    if [[ -n "$hash" ]]; then
      echo "$src|$hash"
      return 0
    fi
  done
  return 1
}

ensure_runtime_env() {
  install -d -m 755 "$APP_DIR"

  if [[ ! -f "$APP_DIR/.env.production.local" ]]; then
    cat > "$APP_DIR/.env.production.local" <<'ENVEOF'
NEXT_PUBLIC_SITE_URL=https://1.mikezhuang.cn
ENVEOF
    chmod 640 "$APP_DIR/.env.production.local"
  fi
}

ensure_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    npm install -g pm2
  fi
}

install_dependencies() {
  npm config set registry "$NPM_REGISTRY"
  if npm ci --no-audit --no-fund --loglevel=error; then
    echo "[tongji-oolong-tea-sync] npm ci succeeded with $NPM_REGISTRY"
    return 0
  fi

  echo "[tongji-oolong-tea-sync] npm ci failed with $NPM_REGISTRY, fallback to $NPM_FALLBACK_REGISTRY"
  rm -rf node_modules
  npm config set registry "$NPM_FALLBACK_REGISTRY"
  npm ci --no-audit --no-fund --loglevel=error
  echo "[tongji-oolong-tea-sync] npm ci succeeded with $NPM_FALLBACK_REGISTRY"
}

reload_nginx_if_possible() {
  nginx -t >/dev/null
  /www/server/nginx/sbin/nginx -s reload >/dev/null 2>&1 || nginx -s reload >/dev/null 2>&1 || true
}

health_check() {
  for i in {1..30}; do
    if curl -fsS http://127.0.0.1:3107/api/health >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

picked=$(pick_source) || { echo "[tongji-oolong-tea-sync] no reachable gitproxy source"; exit 1; }
REPO_URL="${picked%%|*}"
REMOTE_HASH="${picked##*|}"
echo "[tongji-oolong-tea-sync] source=$REPO_URL remote=$REMOTE_HASH"

if [[ ! -d "$APP_DIR/.git" ]]; then
  rm -rf "$APP_DIR"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git remote set-url origin "$REPO_URL"
LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || true)
git fetch --depth 1 origin main
FETCH_HASH=$(git rev-parse origin/main)

git reset --hard HEAD >/dev/null 2>&1 || true
git clean -fd >/dev/null 2>&1 || true

if [[ "$LOCAL_HASH" == "$FETCH_HASH" && -d "$APP_DIR/.next" ]]; then
  echo "[tongji-oolong-tea-sync] no update"
  exit 0
fi

git checkout -B main origin/main
git reset --hard origin/main
ensure_runtime_env
ensure_pm2

install_dependencies
npm run build

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save >/dev/null

if ! health_check; then
  echo "[tongji-oolong-tea-sync] health check failed"
  pm2 logs "$APP_NAME" --lines 80 --nostream || true
  exit 1
fi

reload_nginx_if_possible

echo "[tongji-oolong-tea-sync] deployed $FETCH_HASH"
