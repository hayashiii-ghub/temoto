#!/bin/sh
set -eu

root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
out="$root/public/og-temoto.png"
port="${OG_PORT:-8765}"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

python3 -m http.server "$port" --directory "$root" >/dev/null 2>&1 &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

i=0
until curl -sf "http://127.0.0.1:$port/scripts/og.html" >/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 50 ]; then
    echo "og.html did not become reachable on port $port" >&2
    exit 1
  fi
  sleep 0.1
done

"$chrome" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --virtual-time-budget=8000 \
  --window-size=1200,630 \
  --screenshot="$out" \
  "http://127.0.0.1:$port/scripts/og.html"

sips -g pixelWidth -g pixelHeight "$out"
