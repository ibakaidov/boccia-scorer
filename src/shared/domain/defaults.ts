import type { AppSettings, Court, GameClass, ScoreboardSettings, TimerSettings } from "./types"

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  warmupSec: 120,
  collectBallsSec: 60,
  penaltyBallSec: 60,
  technicalTimeoutSec: 600
}

export const DEFAULT_SCOREBOARD_SETTINGS: ScoreboardSettings = {
  theme: "dark"
}

export const DEFAULT_GAME_CLASSES: GameClass[] = [
  {
    id: "bc1f",
    code: "BC1F",
    nameRu: "BC1 женщины",
    ruleName: "BC1 Individual Female",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 270,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 10
  },
  {
    id: "bc1m",
    code: "BC1M",
    nameRu: "BC1 мужчины",
    ruleName: "BC1 Individual Male",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 270,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 20
  },
  {
    id: "bc2f",
    code: "BC2F",
    nameRu: "BC2 женщины",
    ruleName: "BC2 Individual Female",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 210,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 30
  },
  {
    id: "bc2m",
    code: "BC2M",
    nameRu: "BC2 мужчины",
    ruleName: "BC2 Individual Male",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 210,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 40
  },
  {
    id: "bc3f",
    code: "BC3F",
    nameRu: "BC3 женщины",
    ruleName: "BC3 Individual Female",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 360,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 50
  },
  {
    id: "bc3m",
    code: "BC3M",
    nameRu: "BC3 мужчины",
    ruleName: "BC3 Individual Male",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 360,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 60
  },
  {
    id: "bc4f",
    code: "BC4F",
    nameRu: "BC4 женщины",
    ruleName: "BC4 Individual Female",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 210,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 70
  },
  {
    id: "bc4m",
    code: "BC4M",
    nameRu: "BC4 мужчины",
    ruleName: "BC4 Individual Male",
    kind: "individual",
    endsCount: 4,
    endTimeSec: 210,
    ballsPerAthlete: 6,
    athletesPerSide: 1,
    active: true,
    sortOrder: 80
  },
  {
    id: "pair-bc3",
    code: "ПВС3",
    nameRu: "Пары BC3",
    ruleName: "Pair BC3",
    kind: "pair",
    endsCount: 4,
    endTimeSec: 420,
    ballsPerAthlete: 3,
    athletesPerSide: 2,
    active: true,
    sortOrder: 90
  },
  {
    id: "pair-bc4",
    code: "ПВС4",
    nameRu: "Пары BC4",
    ruleName: "Pair BC4",
    kind: "pair",
    endsCount: 4,
    endTimeSec: 240,
    ballsPerAthlete: 3,
    athletesPerSide: 2,
    active: true,
    sortOrder: 100
  },
  {
    id: "team-bc1-bc2",
    code: "ТВС1/ВС2",
    nameRu: "Команды BC1/BC2",
    ruleName: "Team BC1/BC2",
    kind: "team",
    endsCount: 6,
    endTimeSec: 300,
    ballsPerAthlete: 2,
    athletesPerSide: 3,
    active: true,
    sortOrder: 110
  }
]

export const DEFAULT_COURTS: Court[] = [
  { id: "court-1", name: "Корт 1", active: true, sortOrder: 10 },
  { id: "court-2", name: "Корт 2", active: true, sortOrder: 20 },
  { id: "court-3", name: "Корт 3", active: true, sortOrder: 30 },
  { id: "court-4", name: "Корт 4", active: true, sortOrder: 40 },
  { id: "court-5", name: "Корт 5", active: true, sortOrder: 50 },
  { id: "court-6", name: "Корт 6", active: true, sortOrder: 60 },
  { id: "court-7", name: "Корт 7", active: true, sortOrder: 70 },
  { id: "court-8", name: "Корт 8", active: true, sortOrder: 80 }
]

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  language: "ru",
  server: {
    enabled: false,
    baseUrl: "http://localhost:2007/api/v2"
  },
  timers: DEFAULT_TIMER_SETTINGS,
  hotkeys: {
    redTimer: "KeyZ",
    blueTimer: "KeyM",
    pause: "Space",
    confirm: "Enter",
    cancel: "Escape"
  },
  scoreboard: DEFAULT_SCOREBOARD_SETTINGS,
  gameClasses: DEFAULT_GAME_CLASSES,
  courts: DEFAULT_COURTS
}
