#!/bin/sh
# 開発コンテナ起動時に、lockfile が変わっていれば node_modules を再同期する。
# node_modules は named volume に置くため、ホスト側には生成されない。
set -eu

STAMP="node_modules/.lock-hash"
CURRENT="$(sha256sum package-lock.json | cut -d " " -f1)"

if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$CURRENT" ]; then
  echo "[dev] package-lock.json changed or node_modules empty -> npm ci --ignore-scripts"
  npm ci --ignore-scripts
  echo "$CURRENT" > "$STAMP"
fi

exec "$@"
