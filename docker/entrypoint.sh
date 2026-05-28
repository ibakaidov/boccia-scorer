#!/usr/bin/env bash
set -euo pipefail

uid="${LOCAL_UID:-1000}"
gid="${LOCAL_GID:-1000}"

mkdir -p /workspace/node_modules /cache/npm /cache/electron /cache/electron-builder /cache/ms-playwright
chown -R "$uid:$gid" /workspace/node_modules /cache 2>/dev/null || true

exec setpriv --reuid "$uid" --regid "$gid" --clear-groups "$@"
