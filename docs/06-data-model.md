# Модель данных

Все доменные сущности должны быть описаны TypeScript-типами и, желательно, runtime-схемами валидации.

## GameClass

Классы являются справочником.

```ts
export type GameClassKind = "individual" | "pair" | "team"

export type GameClass = {
  id: string
  code: string
  nameRu: string
  ruleName: string
  kind: GameClassKind
  endsCount: number
  endTimeSec: number
  ballsPerAthlete: number
  athletesPerSide: number
  active: boolean
  sortOrder: number
}
```

## Participant, опционально

Для автономного режима участники не обязательны. Минимальная модель матча должна работать без игроков: есть только класс, красная сторона и синяя сторона.

Если сервер или большое соревнование передает игроков, они сохраняются как опциональные метаданные стороны.

```ts
export type Participant = {
  id: string
  fullName: string
  shortName: string
  gender: "male" | "female"
  gameClassId: string
  regionId?: string
  teamId?: string
  countryId?: string
  active: boolean
}
```

Свободный ручной ввод игрока прямо в форме матча не нужен. В автономном режиме игроки вообще не выбираются.

## Dictionaries

```ts
export type Dictionaries = {
  gameClasses: GameClass[]
  participants?: Participant[]
  courts: Court[]
  regions?: Region[]
  teams?: Team[]
  countries?: Country[]
  syncedAt: string
}
```

Регион, команда и страна являются опциональными серверными метаданными. Автономный матч не зависит от них.

## Match

```ts
export type Match = {
  id: string
  clientId: string
  serverId?: string
  status: MatchStatus
  courtId?: string
  gameClassId: string
  redSide: Side
  blueSide: Side
  officials?: MatchOfficials
  ends: End[]
  tieBreaks: TieBreakEnd[]
  activeEndIndex: number
  phase: MatchPhase
  createdAt: string
  updatedAt: string
  completedAt?: string
}
```

`clientId` нужен для идемпотентной синхронизации и защиты от дублей в серверном режиме. В автономном режиме он также может использоваться как локальный идентификатор истории SQLite.

## Side

```ts
export type SideColor = "red" | "blue"

export type Side = {
  color: SideColor
  label: "Красные" | "Синие"
  participants?: ParticipantRef[]
}

export type ParticipantRef = {
  participantId: string
  box?: number
}
```

## End

```ts
export type End = {
  index: number
  redScore: number
  blueScore: number
  redTimeUsedSec: number
  blueTimeUsedSec: number
  status: "notStarted" | "inProgress" | "completed"
  startedAt?: string
  completedAt?: string
}
```

## TieBreakEnd

```ts
export type TieBreakEnd = {
  index: number
  firstSide: SideColor
  redScore: number
  blueScore: number
  redTimeUsedSec: number
  blueTimeUsedSec: number
  winner?: SideColor
  status: "notStarted" | "inProgress" | "completed"
}
```

Тай-брейков может быть несколько, если предыдущий тай-брейк снова дал равенство.

## TimerState

```ts
export type TimerType =
  | "warmup"
  | "collectBalls"
  | "technicalTimeout"
  | "redEnd"
  | "blueEnd"

export type TimerState = {
  type: TimerType
  maxSec: number
  elapsedSec: number
  running: boolean
  startedAt?: string
  pausedAt?: string
}
```

Хранится использованное время `elapsedSec`. Оставшееся время вычисляется как `maxSec - elapsedSec`.

## MatchSnapshot

```ts
export type MatchSnapshot = {
  match: Match
  timers: Record<TimerType, TimerState>
  scoreboard: ScoreboardState
  savedAt: string
}
```

Снимок сохраняется после каждого значимого действия.

## ScoreboardState

```ts
export type ScoreboardState = {
  mode: "idle" | "warmup" | "end" | "collectBalls" | "tieBreak" | "protocol"
  courtName: string
  gameClassCode: string
  currentEndLabel: string
  red: ScoreboardSide
  blue: ScoreboardSide
  activeTimer?: SideColor | "solo"
  soloTimer?: TimerView
}
```

Табло получает только данные для отображения, без лишней внутренней модели.

## SyncQueueItem

```ts
export type SyncQueueItem = {
  id: string
  matchClientId: string
  type: "startMatch" | "sendEnd" | "finishMatch" | "actionLog"
  payload: unknown
  status: "pending" | "sending" | "synced" | "failed"
  attempts: number
  lastError?: string
  createdAt: string
  updatedAt: string
}
```

## ActionLogEntry

```ts
export type ActionLogEntry = {
  id: string
  matchClientId?: string
  at: string
  actor: "operator" | "system"
  type: string
  payload: unknown
}
```

Лог действий нужен для восстановления, разбора ошибок и синхронизации.

## Автономный протокол

Минимальный автономный протокол содержит только:

| Поле | Обязательность |
|---|---|
| Класс | Обязательно |
| Дата и время | Обязательно |
| Стороны `Красные`/`Синие` | Обязательно |
| Счет по эндам | Обязательно |
| Время по эндам | Обязательно |
| Итоговый счет | Обязательно |
| Тай-брейк | Если был |
| Корт | Не обязателен |
| Судьи | Не нужны |
| Игроки | Не нужны |
| Этап | Не нужен |
