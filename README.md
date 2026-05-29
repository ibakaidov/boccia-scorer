# Boccia Scorer v2

Десктопный offline-first счетчик для матчей по бочча. Приложение открывает окно оператора и отдельное read-only табло, ведет таймеры сторон, счет по эндам и тай-брейкам, сохраняет завершенные матчи в SQLite и умеет складывать отправку результатов в очередь синхронизации.

## Скачать

Последний релиз: https://github.com/ibakaidov/boccia-scorer/releases/latest

Лендинг GitHub Pages: https://ibakaidov.github.io/boccia-scorer/

Артефакты релиза:

| Платформа | Артефакт | Примечание |
|---|---|---|
| macOS | `dmg`, `zip` | Подписывается Developer ID; notarization включим после валидного Apple app-specific password |
| Windows | `nsis`, `portable` | Без подписи; SmartScreen может показать предупреждение |
| Linux | `AppImage` | Запускается как переносимый desktop artifact |

Auto-update использует GitHub Releases. Проверка обновлений запускается только в packaged-приложении и не блокирует работу счетчика.

## Возможности

- Окно оператора и отдельное крупное табло.
- Автономный матч по классу и сторонам `Красные`/`Синие` без сервера.
- Разминка, таймеры сторон, сбор мячей, энды и тай-брейк.
- История завершенных матчей в SQLite.
- Журнал действий и очередь offline-синхронизации.
- Типизированный preload API без прямого доступа renderer к Node.js.

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

## Release

CI запускает `typecheck`, `lint`, `test` и `build` на push/PR. Релизная сборка запускается по тегам `v*` или вручную через GitHub Actions и публикует artifacts в GitHub Release.

Для macOS signing нужны GitHub Actions secrets:

```text
CSC_LINK
CSC_KEY_PASSWORD
APPLE_TEAM_ID
```

Для notarization дополнительно нужны валидные `APPLE_ID` и `APPLE_APP_SPECIFIC_PASSWORD`; сейчас notarization отключена, потому что Apple вернул `401 Invalid credentials` для переданного app-specific password.

Windows релиз намеренно остается unsigned. Это учитывается в CI и updater-конфигурации.
