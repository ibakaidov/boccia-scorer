import { describe, expect, it } from "vitest"
import {
  DEFAULT_GAME_CLASSES,
  calculateMatchTotals,
  completeCurrentEnd,
  completeTieBreak,
  createStandaloneMatch,
  createTieBreak,
  formatMatchResult,
  setEndScore
} from "@shared/domain"

describe("scoring", () => {
  it("sums only completed main ends", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    let match = createStandaloneMatch(gameClass)
    match = setEndScore(match, "red", 2)
    match = setEndScore(match, "blue", 1)
    match = completeCurrentEnd(match)

    expect(calculateMatchTotals(match)).toMatchObject({ red: 2, blue: 1, tied: false, winner: "red" })
  })

  it("uses class data for number of ends", () => {
    const teamClass = DEFAULT_GAME_CLASSES.find((item) => item.code === "ТВС1/ВС2")
    expect(teamClass).toBeDefined()
    expect(createStandaloneMatch(teamClass!).ends).toHaveLength(6)
  })

  it("requires an existing tie-break before selecting its winner", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const match = createStandaloneMatch(gameClass)

    expect(() => completeTieBreak(match, "red")).toThrow("Тай-брейк не найден")
  })

  it("completes tie-break with a selected winner without changing the tied main score", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const match = createTieBreak(createStandaloneMatch(gameClass), "red")

    const completed = completeTieBreak(match, "red")

    expect(completed.phase).toBe("protocol")
    expect(completed.tieBreaks.at(-1)).toMatchObject({ status: "completed", winner: "red" })
    expect(calculateMatchTotals(completed)).toMatchObject({ red: 0, blue: 0, tied: true, winner: "red" })
  })

  it("formats a tie-break winner with a star and equal main score", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const match = completeTieBreak(createTieBreak(createStandaloneMatch(gameClass), "red"), "blue")

    expect(formatMatchResult(match)).toBe("0 : 0*, ТБ")
  })
})
