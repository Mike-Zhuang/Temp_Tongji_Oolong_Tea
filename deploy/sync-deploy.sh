#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/tongji-oolong-tea
SITE_ROOT=/www/wwwroot/1.mikezhuang.cn
APP_NAME=tongji-oolong-tea
DOMAIN=1.mikezhuang.cn
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
VITE_SITE_URL=https://1.mikezhuang.cn
ENVEOF
    chmod 640 "$APP_DIR/.env.production.local"
  fi

  if grep -q '^NEXT_PUBLIC_SITE_URL=' "$APP_DIR/.env.production.local" && ! grep -q '^VITE_SITE_URL=' "$APP_DIR/.env.production.local"; then
    sed -n 's/^NEXT_PUBLIC_SITE_URL=/VITE_SITE_URL=/p' "$APP_DIR/.env.production.local" >> "$APP_DIR/.env.production.local"
  fi

  if grep -q '^NEXT_PUBLIC_SUPABASE_URL=' "$APP_DIR/.env.production.local" && ! grep -q '^VITE_SUPABASE_URL=' "$APP_DIR/.env.production.local"; then
    sed -n 's/^NEXT_PUBLIC_SUPABASE_URL=/VITE_SUPABASE_URL=/p' "$APP_DIR/.env.production.local" >> "$APP_DIR/.env.production.local"
  fi

  if grep -q '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$APP_DIR/.env.production.local" && ! grep -q '^VITE_SUPABASE_ANON_KEY=' "$APP_DIR/.env.production.local"; then
    sed -n 's/^NEXT_PUBLIC_SUPABASE_ANON_KEY=/VITE_SUPABASE_ANON_KEY=/p' "$APP_DIR/.env.production.local" >> "$APP_DIR/.env.production.local"
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

stop_pm2_if_possible() {
  if command -v pm2 >/dev/null 2>&1; then
    pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
    pm2 save >/dev/null || true
    echo "[tongji-oolong-tea-sync] old pm2 app removed if it existed: $APP_NAME"
  fi
}

publish_static_files() {
  install -d -m 755 "$SITE_ROOT"
  find "$SITE_ROOT" -mindepth 1 -maxdepth 1 \
    ! -name ".user.ini" \
    ! -name ".well-known" \
    -exec rm -rf {} +

  cp -a "$APP_DIR/dist/." "$SITE_ROOT/"
  echo "[tongji-oolong-tea-sync] static files published to $SITE_ROOT"
}

ensure_nginx_static_site() {
  local nginx_conf="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
  local proxy_dir="/www/server/panel/vhost/nginx/proxy/${DOMAIN}"
  local rewrite_conf="/www/server/panel/vhost/rewrite/${DOMAIN}.conf"

  if [[ -d "$proxy_dir" ]]; then
    for proxy_conf in "$proxy_dir"/*.conf; do
      [[ -f "$proxy_conf" ]] || continue
      mv "$proxy_conf" "${proxy_conf}.disabled.$(date +%Y%m%d%H%M%S)"
      echo "[tongji-oolong-tea-sync] disabled old reverse proxy: $proxy_conf"
    done
  fi

  install -d -m 755 "$(dirname "$rewrite_conf")"
  if [[ ! -f "$rewrite_conf" ]] || ! grep -q 'try_files \$uri \$uri/ /index.html;' "$rewrite_conf"; then
    cat > "$rewrite_conf" <<'EOF'
try_files $uri $uri/ /index.html;
EOF
    echo "[tongji-oolong-tea-sync] spa rewrite ensured: $rewrite_conf"
  fi

  if [[ ! -f "$nginx_conf" ]]; then
    echo "[tongji-oolong-tea-sync] nginx conf not found, skip auto static rewrite: $nginx_conf"
    return 0
  fi

  if grep -q "proxy_pass http://127.0.0.1:3107" "$nginx_conf"; then
    cp "$nginx_conf" "${nginx_conf}.bak.$(date +%Y%m%d%H%M%S)"
    python3 - "$nginx_conf" "$SITE_ROOT" <<'PYEOF'
from pathlib import Path
import re
import sys

conf_path = Path(sys.argv[1])
site_root = sys.argv[2]
text = conf_path.read_text()
replacement = f"""location / {{
        root {site_root};
        try_files $uri $uri/ /index.html;
        index index.html;
    }}"""
text = re.sub(
    r"location\s*/\s*\{[^{}]*proxy_pass\s+http://127\.0\.0\.1:3107/?;[^{}]*\}",
    replacement,
    text,
    count=1,
    flags=re.S,
)
conf_path.write_text(text)
PYEOF
    echo "[tongji-oolong-tea-sync] nginx reverse proxy replaced by static root"
  fi
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
git checkout -B main origin/main
git reset --hard origin/main

ensure_runtime_env

NEEDS_BUILD=1
if [[ "$LOCAL_HASH" == "$FETCH_HASH" && -f "$SITE_ROOT/index.html" && -d "$APP_DIR/dist" ]]; then
  NEEDS_BUILD=0
  echo "[tongji-oolong-tea-sync] no code update, reuse existing static build"
fi

if [[ "$NEEDS_BUILD" -eq 1 ]]; then
  rm -rf .next dist
  install_dependencies
  npm run build
fi

publish_static_files
stop_pm2_if_possible
ensure_nginx_static_site
reload_nginx_if_possible

echo "[tongji-oolong-tea-sync] deployed $FETCH_HASH"
