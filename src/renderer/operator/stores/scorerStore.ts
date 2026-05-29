import { defineStore } from "pinia"
import {
  DEFAULT_SETTINGS,
  allMainEndsCompleted,
  beginEnds,
  beginWarmup,
  buildScoreboardState,
  calculateMainTotals,
  calculateMatchTotals,
  completeCurrentEnd,
  completeMatch as completeDomainMatch,
  completeTieBreak as completeDomainTieBreak,
  createId,
  createMatchTimers,
  createStandaloneMatch,
  createTieBreak,
  goToNextEnd,
  needsTieBreak as matchNeedsTieBreak,
  nowIso,
  pauseAllTimers,
  pauseTimer,
  resetTimer,
  setEndScore,
  setEndTime,
  setTieBreakTime,
  startTimer,
  tickRunningTimers,
  toggleExclusiveSideTimer
} from "@shared/domain"
import type {
  ActionLogEntry,
  AppSettings,
  AppStatus,
  GameClass,
  Match,
  ScoreboardState,
  SideColor,
  SyncQueueItem,
  TimerState,
  TimerType
} from "@shared/domain"

type State = {
  loaded: boolean
  settings: AppSettings
  status: AppStatus
  match: Match | undefined
  timers: Record<TimerType, TimerState> | undefined
  scoreboard: ScoreboardState
  syncQueue: SyncQueueItem[]
  history: Match[]
  actionLog: ActionLogEntry[]
  lastSnapshotAt: number
}

type StartMatchOptions = {
  replaceExisting?: boolean
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isCompletedMatch(match: Match | undefined): boolean {
  return match?.status === "completed" || match?.phase === "completed"
}

function canRunSideTimers(match: Match | undefined): boolean {
  return Boolean(match && !isCompletedMatch(match) && (match.phase === "end" || match.phase === "tieBreak"))
}

export const useScorerStore = defineStore("scorer", {
  state: (): State => ({
    loaded: false,
    settings: DEFAULT_SETTINGS,
    status: {
      appVersion: "0.1.0",
      serverOnline: false,
      pendingSync: 0,
      failedSync: 0
    },
    scoreboard: buildScoreboardState(undefined, undefined, DEFAULT_SETTINGS, "Автономно"),
    syncQueue: [],
    history: [],
    actionLog: [],
    match: undefined,
    timers: undefined,
    lastSnapshotAt: 0
  }),
  getters: {
    activeGameClass(state): GameClass | undefined {
      return state.settings.gameClasses.find((item) => item.id === state.match?.gameClassId)
    },
    activeEnd(state) {
      return state.match?.ends[state.match.activeEndIndex]
    },
    totals(state) {
      return state.match ? calculateMatchTotals(state.match) : { red: 0, blue: 0, tied: true }
    },
    syncLabel(state): string {
      const pending = state.syncQueue.filter((item) => item.status === "pending").length
      const failed = state.syncQueue.filter((item) => item.status === "failed").length
      if (failed > 0) return `Sync: ${failed} failed`
      if (pending > 0) return `Sync: ${pending} pending`
      return state.settings.server.enabled ? "Sync: готов" : "Автономно"
    }
  },
  actions: {
    async bootstrap() {
      this.settings = await window.bocciaApi.settings.load()
      this.status = await window.bocciaApi.app.getStatus()
      this.syncQueue = await window.bocciaApi.sync.list()
      this.history = await window.bocciaApi.match.listHistory()
      const snapshot = await window.bocciaApi.match.loadSnapshot()
      if (snapshot?.match && snapshot.timers) {
        this.match = snapshot.match
        this.timers = snapshot.timers
        this.scoreboard = snapshot.scoreboard
      }
      await this.refreshScoreboard()
      this.loaded = true
    },
    async saveSettings(settings: AppSettings) {
      this.settings = await window.bocciaApi.settings.save(settings)
      await this.recordAction("settings.save", { schemaVersion: settings.schemaVersion })
      await this.refreshScoreboard()
    },
    async resetSettings() {
      this.settings = await window.bocciaApi.settings.reset()
      await this.recordAction("settings.reset", {})
      await this.refreshScoreboard()
    },
    async startStandaloneMatch(gameClassId: string, courtId?: string, options: StartMatchOptions = {}) {
      const gameClass = this.settings.gameClasses.find((item) => item.id === gameClassId)
      if (!gameClass) throw new Error("Класс не найден")
      if (this.match && !options.replaceExisting) {
        throw new Error("Уже есть текущий матч. Подтвердите создание нового матча.")
      }
      this.actionLog = []
      this.match = createStandaloneMatch(gameClass, courtId || undefined)
      this.timers = createMatchTimers(gameClass.endTimeSec, this.settings.timers)
      await this.recordAction("match.create", { gameClassId, courtId })
      await this.enqueue("startMatch", {
        clientMatchId: this.match.clientId,
        courtId: this.match.courtId ?? null,
        gameClassId: this.match.gameClassId,
        redSide: this.match.redSide,
        blueSide: this.match.blueSide,
        officials: null,
        startedAt: this.match.createdAt
      })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async startWarmup() {
      if (!this.match || !this.timers) return
      if (isCompletedMatch(this.match)) return
      this.match = beginWarmup(this.match)
      this.timers.warmup = resetTimer(this.timers.warmup)
      await this.recordAction("match.warmup.start", {})
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async toggleWarmupTimer() {
      if (!this.match || !this.timers) return
      if (isCompletedMatch(this.match)) return
      if (this.match.phase !== "setup" && this.match.phase !== "warmup") return
      this.timers.warmup = this.timers.warmup.running ? pauseTimer(this.timers.warmup) : startTimer(this.timers.warmup)
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async startEnds() {
      if (!this.match) return
      if (isCompletedMatch(this.match)) return
      this.match = beginEnds(this.match)
      await this.recordAction("match.ends.start", { end: this.match.activeEndIndex + 1 })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async toggleSideTimer(color: SideColor) {
      if (!this.timers) return
      if (!canRunSideTimers(this.match)) return
      this.timers = toggleExclusiveSideTimer(this.timers, color === "red" ? "redEnd" : "blueEnd")
      await this.recordAction("timer.side.toggle", { color })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async pauseTimers() {
      if (!this.timers) return
      if (isCompletedMatch(this.match)) return
      this.timers = pauseAllTimers(this.timers)
      await this.recordAction("timer.pauseAll", {})
      await this.syncEndTimeFromTimers()
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async tick() {
      if (!this.timers) return
      if (isCompletedMatch(this.match) || this.match?.phase === "protocol" || this.match?.phase === "setup") return
      this.timers = tickRunningTimers(this.timers)
      await this.syncEndTimeFromTimers()
      await this.persistSnapshot(false)
      await this.refreshScoreboard()
    },
    async changeScore(color: SideColor, delta: number) {
      if (!this.match) return
      if (this.match.phase === "tieBreak") return
      const current = this.match.ends[this.match.activeEndIndex]
      if (this.match.phase !== "end" || current?.status !== "inProgress") return
      const value = color === "red" ? (current?.redScore ?? 0) + delta : (current?.blueScore ?? 0) + delta
      this.match = setEndScore(this.match, color, value)
      await this.recordAction("score.change", { color, delta })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async completeEnd() {
      if (!this.match) return
      if (this.match.phase !== "end" || this.activeEnd?.status !== "inProgress") return
      await this.pauseTimers()
      this.match = completeCurrentEnd(this.match)
      if (this.match.phase === "collectBalls" && this.timers) {
        this.timers.collectBalls = startTimer(resetTimer(this.timers.collectBalls))
      }
      const end = this.match.ends[this.match.activeEndIndex]
      await this.recordAction("end.complete", { end })
      await this.enqueue("sendEnd", { clientEventId: createId("event"), end })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async nextEnd() {
      if (!this.match || !this.timers || !this.activeGameClass) return
      if (this.match.phase !== "collectBalls") return
      this.match = goToNextEnd(this.match)
      this.timers.redEnd = resetTimer({ ...this.timers.redEnd, maxSec: this.activeGameClass.endTimeSec })
      this.timers.blueEnd = resetTimer({ ...this.timers.blueEnd, maxSec: this.activeGameClass.endTimeSec })
      this.timers.collectBalls = resetTimer(this.timers.collectBalls)
      await this.recordAction("end.next", { end: this.match.activeEndIndex + 1 })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async startTieBreak(firstSide: SideColor) {
      if (!this.match || this.match.phase !== "protocol" || !matchNeedsTieBreak(this.match)) return
      this.match = createTieBreak(this.match, firstSide)
      if (this.timers && this.activeGameClass) {
        this.timers.redEnd = resetTimer({ ...this.timers.redEnd, maxSec: this.activeGameClass.endTimeSec })
        this.timers.blueEnd = resetTimer({ ...this.timers.blueEnd, maxSec: this.activeGameClass.endTimeSec })
      }
      await this.recordAction("tiebreak.start", { firstSide })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async completeTieBreak(winner: SideColor) {
      if (!this.match) return
      const current = this.match.tieBreaks.at(-1)
      if (this.match.phase !== "tieBreak" || current?.status !== "inProgress") return
      await this.pauseTimers()
      this.match = completeDomainTieBreak(this.match, winner)
      await this.recordAction("tiebreak.complete", { tieBreak: this.match.tieBreaks.at(-1) })
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async finishMatch() {
      if (!this.match) return
      if (matchNeedsTieBreak(this.match)) throw new Error("Нужен тай-брейк перед завершением")
      this.match = completeDomainMatch(this.match)
      await window.bocciaApi.match.complete(toPlain(this.match))
      await this.enqueue("finishMatch", {
        clientEventId: createId("event"),
        match: this.match,
        actionLog: this.actionLog,
        completedAt: this.match.completedAt
      })
      await this.recordAction("match.finish", { clientId: this.match.clientId })
      this.history = await window.bocciaApi.match.listHistory()
      await this.persistSnapshot(true)
      await this.refreshScoreboard()
    },
    async runSync() {
      this.syncQueue = await window.bocciaApi.sync.run()
      this.status = await window.bocciaApi.app.getStatus()
      await this.refreshScoreboard()
    },
    async refreshHistory() {
      this.history = await window.bocciaApi.match.listHistory()
    },
    async refreshScoreboard() {
      this.scoreboard = buildScoreboardState(this.match, this.timers, this.settings, this.syncLabel)
      await window.bocciaApi.scoreboard.update(toPlain(this.scoreboard))
    },
    canFinishMainEnds(): boolean {
      return Boolean(this.match && allMainEndsCompleted(this.match))
    },
    needsTieBreak(): boolean {
      return Boolean(this.match && matchNeedsTieBreak(this.match))
    },
    mainTotals() {
      return this.match ? calculateMainTotals(this.match.ends) : { red: 0, blue: 0, tied: true }
    },
    async syncEndTimeFromTimers() {
      if (!this.match || !this.timers) return
      if (isCompletedMatch(this.match)) return
      if (this.match.phase !== "end" && this.match.phase !== "tieBreak") return
      if (this.match.phase === "tieBreak") {
        this.match = setTieBreakTime(this.match, "red", this.timers.redEnd.elapsedSec)
        this.match = setTieBreakTime(this.match, "blue", this.timers.blueEnd.elapsedSec)
        return
      }
      this.match = setEndTime(this.match, "red", this.timers.redEnd.elapsedSec)
      this.match = setEndTime(this.match, "blue", this.timers.blueEnd.elapsedSec)
    },
    async persistSnapshot(force: boolean) {
      if (!this.match || !this.timers) return
      const now = Date.now()
      if (!force && now - this.lastSnapshotAt < 5000) return
      this.lastSnapshotAt = now
      await window.bocciaApi.match.saveSnapshot(toPlain({
        match: this.match,
        timers: this.timers,
        scoreboard: this.scoreboard,
        savedAt: nowIso()
      }))
    },
    async recordAction(type: string, payload: unknown) {
      const entry: ActionLogEntry = {
        id: createId("log"),
        ...(this.match ? { matchClientId: this.match.clientId } : {}),
        at: nowIso(),
        actor: "operator",
        type,
        payload: payload ?? null
      }
      this.actionLog.push(entry)
      await window.bocciaApi.actionLog.add(toPlain(entry))
    },
    async enqueue(type: SyncQueueItem["type"], payload: unknown) {
      if (!this.match) return
      const item: SyncQueueItem = {
        id: createId("sync"),
        matchClientId: this.match.clientId,
        type,
        payload,
        status: "pending",
        attempts: 0,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
      this.syncQueue.push(item)
      await window.bocciaApi.sync.enqueue(toPlain(item))
    }
  }
})
