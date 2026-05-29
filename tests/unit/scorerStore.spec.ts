import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useScorerStore } from "@renderer/operator/stores/scorerStore"
import { DEFAULT_SETTINGS, createMatchTimers, createStandaloneMatch, createTieBreak } from "@shared/domain"
import type { BocciaApi } from "@shared/ipc/api"

function cloneCheckedMock<T>() {
  return vi.fn((payload: T) => {
    structuredClone(payload)
    return Promise.resolve()
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  window.bocciaApi = {
    app: {
      getVersion: vi.fn(),
      getStatus: vi.fn(() => Promise.resolve({ appVersion: "0.1.0", serverOnline: false, pendingSync: 0, failedSync: 0 }))
    },
    settings: {
      load: vi.fn(() => Promise.resolve(DEFAULT_SETTINGS)),
      save: vi.fn(),
      reset: vi.fn()
    },
    match: {
      saveSnapshot: cloneCheckedMock(),
      loadSnapshot: vi.fn(() => Promise.resolve(undefined)),
      complete: cloneCheckedMock(),
      listHistory: vi.fn(() => Promise.resolve([]))
    },
    actionLog: {
      add: cloneCheckedMock(),
      list: vi.fn()
    },
    sync: {
      enqueue: cloneCheckedMock(),
      list: vi.fn(() => Promise.resolve([])),
      run: vi.fn()
    },
    scoreboard: {
      update: cloneCheckedMock(),
      onUpdate: vi.fn()
    }
  } as unknown as BocciaApi
})

describe("scorerStore", () => {
  it("sends cloneable plain objects through IPC when starting a match", async () => {
    const store = useScorerStore()

    await expect(store.startStandaloneMatch("bc1f")).resolves.toBeUndefined()

    expect(window.bocciaApi.match.saveSnapshot).toHaveBeenCalledOnce()
    expect(window.bocciaApi.scoreboard.update).toHaveBeenCalledOnce()
    expect(window.bocciaApi.sync.enqueue).toHaveBeenCalledOnce()
  })

  it("clears previous action log entries when starting a new match", async () => {
    const store = useScorerStore()

    await store.startStandaloneMatch("bc1f")
    await store.recordAction("score.change", { color: "red", delta: 1 })
    await store.startStandaloneMatch("bc1f", undefined, { replaceExisting: true })

    expect(store.actionLog).toHaveLength(1)
    expect(store.actionLog[0]).toMatchObject({ type: "match.create" })
    expect(store.actionLog[0]?.matchClientId).toBe(store.match?.clientId)
  })

  it("does not replace an existing match without explicit confirmation", async () => {
    const store = useScorerStore()

    await store.startStandaloneMatch("bc1f")
    const firstClientId = store.match?.clientId

    await expect(store.startStandaloneMatch("bc1f")).rejects.toThrow("Уже есть текущий матч")

    expect(store.match?.clientId).toBe(firstClientId)

    await store.startStandaloneMatch("bc1f", undefined, { replaceExisting: true })

    expect(store.match?.clientId).not.toBe(firstClientId)
  })

  it("does not submit or change a completed end again", async () => {
    const store = useScorerStore()

    await store.startStandaloneMatch("bc1f")
    await store.startEnds()
    await store.changeScore("red", 1)
    await store.completeEnd()
    const syncQueueLength = store.syncQueue.length
    const actionLogLength = store.actionLog.length

    await store.completeEnd()
    await store.changeScore("blue", 1)

    expect(store.syncQueue).toHaveLength(syncQueueLength)
    expect(store.actionLog).toHaveLength(actionLogLength)
    expect(store.activeEnd).toMatchObject({ redScore: 1, blueScore: 0, status: "completed" })
  })

  it("does not mutate timers after a match is completed", async () => {
    const store = useScorerStore()

    await store.startStandaloneMatch("bc1f")
    store.match = { ...store.match!, status: "completed", phase: "completed" }
    store.timers = {
      ...store.timers!,
      redEnd: { ...store.timers!.redEnd, elapsedSec: 9, running: true }
    }
    const actionLogLength = store.actionLog.length

    await store.toggleSideTimer("red")
    await store.tick()
    await store.pauseTimers()

    expect(store.timers.redEnd).toMatchObject({ elapsedSec: 9, running: true })
    expect(store.actionLog).toHaveLength(actionLogLength)
  })

  it("starts collect balls timer after completing a non-final end", async () => {
    const store = useScorerStore()

    await store.startStandaloneMatch("bc1f")
    await store.startEnds()
    await store.completeEnd()

    expect(store.match?.phase).toBe("collectBalls")
    expect(store.timers?.collectBalls.running).toBe(true)
    expect(store.scoreboard.soloTimer?.running).toBe(true)
  })

  it("restores active snapshot during bootstrap", async () => {
    const gameClass = DEFAULT_SETTINGS.gameClasses[0]!
    const match = createStandaloneMatch(gameClass)
    const timers = createMatchTimers(gameClass.endTimeSec, DEFAULT_SETTINGS.timers)
    vi.mocked(window.bocciaApi.match.loadSnapshot).mockResolvedValue({
      match,
      timers,
      scoreboard: storelessScoreboard(),
      savedAt: "2026-05-29T00:00:00.000Z"
    })
    const store = useScorerStore()

    await store.bootstrap()

    expect(store.match?.clientId).toBe(match.clientId)
    expect(store.timers?.redEnd.maxSec).toBe(gameClass.endTimeSec)
    expect(window.bocciaApi.scoreboard.update).toHaveBeenCalled()
  })

  it("continues tie-break when the position is equidistant", async () => {
    const store = useScorerStore()

    await store.startStandaloneMatch("bc1f")
    store.match = createTieBreak({ ...store.match!, phase: "protocol" }, "red")

    await store.continueTieBreak("blue")

    expect(store.match?.phase).toBe("tieBreak")
    expect(store.match?.tieBreaks).toHaveLength(2)
    expect(store.match?.tieBreaks[0]).toMatchObject({ status: "completed" })
    expect(store.match?.tieBreaks[0]?.winner).toBeUndefined()
    expect(store.match?.tieBreaks[1]).toMatchObject({ index: 2, firstSide: "blue", status: "inProgress" })
    expect(store.timers?.redEnd.elapsedSec).toBe(0)
    expect(store.timers?.blueEnd.elapsedSec).toBe(0)
  })
})

function storelessScoreboard() {
  return {
    mode: "idle" as const,
    courtName: "Корт не выбран",
    gameClassCode: "-",
    currentEndLabel: "Ожидание",
    red: {
      color: "red" as const,
      label: "Красные",
      timer: { maxSec: 0, elapsedSec: 0, remainingSec: 0, running: false, label: "00:00" },
      endScore: 0,
      totalScore: 0,
      participantsLabel: "Красные"
    },
    blue: {
      color: "blue" as const,
      label: "Синие",
      timer: { maxSec: 0, elapsedSec: 0, remainingSec: 0, running: false, label: "00:00" },
      endScore: 0,
      totalScore: 0,
      participantsLabel: "Синие"
    },
    statusLabel: "Автономно",
    syncLabel: "Автономно",
    endProgress: [],
    completedEnds: [],
    tieBreaks: []
  }
}
