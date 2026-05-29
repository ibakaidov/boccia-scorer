# Сборка и релизы

Приложение собирается под Windows, Linux и macOS через GitHub Actions и публикуется в GitHub Releases.

## Артефакты

| Платформа | Артефакт |
|---|---|
| Windows | `nsis`, `portable` |
| Linux | `AppImage` |
| macOS | `dmg`, `zip` |

`zip` для macOS обязателен для auto-update. Windows сборка остается без подписи, поэтому Windows SmartScreen может показать предупреждение при первом запуске.

## Версионирование

Использовать semver:

| Версия | Значение |
|---|---|
| `MAJOR` | Несовместимые изменения данных или API |
| `MINOR` | Новые функции |
| `PATCH` | Исправления |

Первый публичный релиз v2 публикуется как `v2.0.0`.

## GitHub Actions

| Workflow | Назначение |
|---|---|
| `CI` | Проверка `typecheck`, `lint`, `test`, `build` на push/PR |
| `Release` | Matrix-сборка Windows, macOS и Linux, публикация в GitHub Release |
| `GitHub Pages` | Деплой статического лендинга из `landing/` |

Release workflow запускается:

1. По тегу `v*`.
2. Вручную через `workflow_dispatch`.

## Auto-update

Auto-update использует GitHub Releases provider из `electron-builder`.

Поведение:

1. Проверка обновлений запускается только в packaged-приложении.
2. Ошибки проверки логируются и не блокируют работу счетчика.
3. Windows update path учитывает unsigned build.
4. macOS update требует подписанный `zip` artifact.

## Подпись macOS

Для macOS release нужны GitHub Actions secrets:

```text
CSC_LINK
CSC_KEY_PASSWORD
APPLE_ID
APPLE_APP_SPECIFIC_PASSWORD
APPLE_TEAM_ID
```

`CSC_LINK` должен содержать base64 от `Developer ID Application` p12. `APPLE_APP_SPECIFIC_PASSWORD` нужен для notarization через Apple ID.

## Windows без подписи

Windows artifacts собираются без code signing certificate. Для CI используется `CSC_IDENTITY_AUTO_DISCOVERY=false` в unsigned jobs. В release notes и README нужно явно писать, что SmartScreen warning ожидаем.

## GitHub Pages

Статический лендинг находится в `landing/` и публикуется через workflow `GitHub Pages`.

Лендинг должен содержать:

1. Краткое описание счетчика.
2. Ссылку на latest GitHub Release.
3. Предупреждение о Windows unsigned build.
4. Описание macOS/Linux artifacts.

## Release checklist

Перед релизом:

1. Typecheck прошел.
2. Lint прошел.
3. Unit-тесты прошли.
4. Component-тесты прошли.
5. E2E smoke прошел.
6. Проверен запуск двух окон.
7. Проверен offline-mode.
8. Проверено сохранение завершенного автономного матча в SQLite.
9. Проверена отправка матча на тестовый сервер, если серверный режим включен.
10. Проверена сборка на целевых платформах.
11. Проверены GitHub Actions secrets для macOS signing/notarization.
12. Проверено, что Windows release notes содержат unsigned warning.
13. Проверен GitHub Pages landing.

## CI

Минимальный CI:

```text
install
typecheck
lint
test
test:e2e:smoke
build
upload artifacts
```

## Tag flow

1. Убедиться, что `main` чистый и все проверки прошли.
2. Обновить версию в `package.json` и `package-lock.json`.
3. Сделать commit с release infrastructure или version bump.
4. Запушить `main`.
5. Создать тег:

```bash
git tag v2.0.0
git push origin v2.0.0
```

6. Дождаться workflow `Release`.
7. Проверить artifacts в GitHub Release.

## Smoke-test релиза

Smoke-test выполняется вручную на собранном приложении.

Сценарий:

1. Запустить приложение.
2. Убедиться, что открыты окно оператора и окно табло.
3. Создать автономный матч, выбрав только класс.
4. Проверить стороны `Красные` и `Синие`.
5. Запустить разминку.
6. Провести один энд.
7. Проверить табло.
8. Завершить матч без кода.
9. Проверить сохранение завершенного матча в SQLite.
10. Проверить отправку или очередь синхронизации, если включен server-mode.

## Smoke-test auto-update

1. Установить `v2.0.0` из GitHub Release.
2. Опубликовать patch-релиз, например `v2.0.1`.
3. Запустить packaged-приложение `v2.0.0`.
4. Проверить, что обновление находится через GitHub Releases.
5. Проверить установку обновления после выхода из приложения.
6. На Windows учитывать, что build unsigned и SmartScreen warning ожидаем.

## Миграции данных

Локальные данные должны иметь `schemaVersion`.

При изменении формата настроек, кэша или матчей нужна миграция.

Миграции должны быть идемпотентными и тестируемыми.
