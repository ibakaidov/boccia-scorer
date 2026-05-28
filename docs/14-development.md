# Разработка

Документ описывает правила разработки будущего проекта.

## Целевой стек

| Область | Инструмент |
|---|---|
| Runtime | Node.js LTS |
| UI | Vue 3 |
| Сборка | Vite |
| Desktop | Electron |
| State | Pinia |
| Tests | Vitest, Vue Testing Library, Playwright |
| Language | TypeScript strict |

## Структура проекта

```text
src/
  main/
    windows/
    ipc/
    storage/
    sync/
  preload/
    index.ts
  renderer/
    operator/
    scoreboard/
    components/
    stores/
    routes/
  shared/
    domain/
    api/
    ipc/
    validation/
    utils/
tests/
  unit/
  component/
  e2e/
```

## Команды

Точные команды фиксируются после создания проекта.

Ожидаемый набор:

| Команда | Назначение |
|---|---|
| `npm run dev` | Разработка renderer/Electron |
| `npm run typecheck` | Проверка TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Форматирование |
| `npm run test` | Unit/component тесты |
| `npm run test:e2e` | E2E тесты |
| `npm run build` | Production build |
| `npm run build:electron` | Сборка дистрибутива |

## Правила кода

| Правило | Описание |
|---|---|
| TypeScript strict | Не отключать strict без причины |
| Доменные функции отдельно | Счет и таймеры не прятать в компоненты |
| Компоненты тонкие | UI вызывает store/actions, не содержит бизнес-логику |
| IPC типизирован | Нет строковых каналов без типов |
| API типизирован | Request/response описаны типами и схемами |
| Настройки версионированы | Любой storage имеет schemaVersion |

## Работа с правилами

Правила скачаны в `docs/world-boccia-rules-2025-2028-v1.2.1.pdf`.

Для повторного извлечения текста можно использовать:

```bash
pdftotext -layout docs/world-boccia-rules-2025-2028-v1.2.1.pdf /tmp/opencode/world-boccia-rules-2025-2028-v1.2.1.txt
```

`poppler-utils` был установлен для парсинга PDF. Пользователь разрешил устанавливать такие инструменты.

## Ветки и изменения

До появления git-репозитория правила ветвления не применяются.

После инициализации репозитория желательно использовать:

| Ветка | Назначение |
|---|---|
| `main` | Стабильная версия |
| `feature/*` | Новые функции |
| `fix/*` | Исправления |
| `docs/*` | Документация |

## Definition of Done

Фича считается готовой, если:

1. Есть типы данных.
2. Есть unit-тесты для логики.
3. UI работает в окне оператора.
4. Табло получает корректное состояние.
5. Состояние сохраняется локально.
6. Offline behavior описан и протестирован.
7. Нет прямого доступа renderer к Node.js.
8. Документация обновлена.
