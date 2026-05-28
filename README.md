# Boccia Scorer v2

Desktop offline-first scorer for boccia matches.

## Stack

Vue 3, Vite, Electron, TypeScript strict, Pinia, SQLite, Vitest, Playwright.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run build:electron
```

## Docker Commands

Host Node.js is not required. Docker Compose keeps reusable caches in named volumes.

```bash
./scripts/docker-task.sh install
./scripts/docker-task.sh typecheck
./scripts/docker-task.sh lint
./scripts/docker-task.sh test
./scripts/docker-task.sh build
./scripts/docker-task.sh package-linux
./scripts/docker-task.sh ci
```

BuildKit image targets:

```bash
./scripts/docker-task.sh test-image
./scripts/docker-task.sh build-image
./scripts/docker-task.sh package-image
```

## Current Scope

- Operator window and read-only scoreboard window.
- Standalone match start by game class only.
- Russian-only UI.
- Timers use `elapsedSec` as source of truth.
- Score by ends and tie-breaks.
- Completed match history in SQLite.
- Action log and offline sync queue.
- Typed preload API instead of direct renderer access to Node.js.
