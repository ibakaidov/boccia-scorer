import { describe, expect, it } from "vitest"
import { DEFAULT_SETTINGS, buildScoreboardState, createMatchTimers, createStandaloneMatch } from "@shared/domain"
import type { End, Match, TieBreakEnd } from "@shared/domain"

const gameClass = DEFAULT_SETTINGS.gameClasses[0]!
const timers = createMatchTimers(gameClass.endTimeSec, DEFAULT_SETTINGS.timers)

function completedEnd(index: number, redScore: number, blueScore: number): End {
  return {
    index,
    redScore,
    blueScore,
    redTimeUsedSec: 0,
    blueTimeUsedSec: 0,
    status: "completed",
    completedAt: "2026-05-29T00:00:00.000Z"
  }
}

function baseMatch(): Match {
  return createStandaloneMatch(gameClass)
}

describe("buildScoreboardState", () => {
  it("labels warmup instead of the first end", () => {
    const match: Match = { ...baseMatch(), phase: "warmup" }

    const state = buildScoreboardState(match, timers, DEFAULT_SETTINGS, "Автономно")

    expect(state.currentEndLabel).toBe("Разминка")
  })

  it("does not expose the last main end as active score in protocol", () => {
    const match: Match = {
      ...baseMatch(),
      phase: "protocol",
      activeEndIndex: 3,
      ends: [completedEnd(1, 1, 0), completedEnd(2, 1, 0), completedEnd(3, 1, 0), completedEnd(4, 1, 0)]
    }

    const state = buildScoreboardState(match, timers, DEFAULT_SETTINGS, "Автономно")

    expect(state.red.totalScore).toBe(4)
    expect(state.blue.totalScore).toBe(0)
    expect(state.red.endScore).toBe(0)
    expect(state.blue.endScore).toBe(0)
  })

  it("uses the active tie-break as active score instead of the last main end", () => {
    const tieBreak: TieBreakEnd = {
      index: 1,
      firstSide: "red",
      redScore: 0,
      blueScore: 0,
      redTimeUsedSec: 0,
      blueTimeUsedSec: 0,
      status: "inProgress"
    }
    const match: Match = {
      ...baseMatch(),
      phase: "tieBreak",
      activeEndIndex: 3,
      ends: [completedEnd(1, 1, 0), completedEnd(2, 0, 1), completedEnd(3, 1, 0), completedEnd(4, 0, 1)],
      tieBreaks: [tieBreak]
    }

    const state = buildScoreboardState(match, timers, DEFAULT_SETTINGS, "Автономно")

    expect(state.currentEndLabel).toBe("Тай-брейк 1")
    expect(state.red.endScore).toBe(0)
    expect(state.blue.endScore).toBe(0)
  })
})
