import type { ActionLogEntry, AppSettings, AppStatus, Match, MatchSnapshot, ScoreboardState, SyncQueueItem } from "@shared/domain"

export type Unsubscribe = () => void

export type BocciaApi = {
  app: {
    getVersion: () => Promise<string>
    getStatus: () => Promise<AppStatus>
  }
  settings: {
    load: () => Promise<AppSettings>
    save: (settings: AppSettings) => Promise<AppSettings>
    reset: () => Promise<AppSettings>
  }
  match: {
    saveSnapshot: (snapshot: MatchSnapshot) => Promise<void>
    loadSnapshot: () => Promise<MatchSnapshot | undefined>
    complete: (match: Match) => Promise<void>
    listHistory: () => Promise<Match[]>
  }
  actionLog: {
    add: (entry: ActionLogEntry) => Promise<void>
    list: (matchClientId?: string) => Promise<ActionLogEntry[]>
  }
  sync: {
    enqueue: (item: SyncQueueItem) => Promise<void>
    list: () => Promise<SyncQueueItem[]>
    run: () => Promise<SyncQueueItem[]>
  }
  scoreboard: {
    update: (state: ScoreboardState) => Promise<void>
    onUpdate: (handler: (state: ScoreboardState) => void) => Unsubscribe
  }
}

export const IPC_CHANNELS = {
  appGetVersion: "app:getVersion",
  appGetStatus: "app:getStatus",
  settingsLoad: "settings:load",
  settingsSave: "settings:save",
  settingsReset: "settings:reset",
  matchSaveSnapshot: "match:saveSnapshot",
  matchLoadSnapshot: "match:loadSnapshot",
  matchComplete: "match:complete",
  matchListHistory: "match:listHistory",
  actionLogAdd: "actionLog:add",
  actionLogList: "actionLog:list",
  syncEnqueue: "sync:enqueue",
  syncList: "sync:list",
  syncRun: "sync:run",
  scoreboardUpdate: "scoreboard:update",
  scoreboardPush: "scoreboard:push"
} as const
