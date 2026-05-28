#!/usr/bin/env bash
set -euo pipefail

TASK="${1:-ci}"
shift || true

if [[ -z "${DOCKER:-}" ]]; then
  if docker info >/dev/null 2>&1; then
    DOCKER="docker"
  else
    DOCKER="sudo docker"
  fi
fi
COMPOSE="$DOCKER compose"
export LOCAL_UID="${LOCAL_UID:-$(id -u)}"
export LOCAL_GID="${LOCAL_GID:-$(id -g)}"

case "$TASK" in
  install|typecheck|lint|test|build|package-linux|ci|shell|app)
    $COMPOSE run --rm "$TASK" "$@"
    ;;
  build-image)
    $DOCKER buildx build --target build --tag boccia-scorer-v2:build --load .
    ;;
  test-image)
    $DOCKER buildx build --target test --tag boccia-scorer-v2:test --load .
    ;;
  package-image)
    $DOCKER buildx build --target package-linux --tag boccia-scorer-v2:package-linux --load .
    ;;
  clean)
    $COMPOSE down --volumes --remove-orphans
    ;;
  *)
    printf 'Unknown task: %s\n' "$TASK" >&2
    printf 'Usage: %s [install|typecheck|lint|test|build|package-linux|ci|shell|app|build-image|test-image|package-image|clean]\n' "$0" >&2
    exit 2
    ;;
esac
