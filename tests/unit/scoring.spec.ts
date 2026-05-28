import { describe, expect, it } from "vitest"
import {
  DEFAULT_GAME_CLASSES,
  calculateMatchTotals,
  completeCurrentEnd,
  completeTieBreak,
  createStandaloneMatch,
  createTieBreak,
  setEndScore,
  setTieBreakScore
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

  it("rejects tied tie-break completion", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const match = createTieBreak(createStandaloneMatch(gameClass), "red")

    expect(() => completeTieBreak(match)).toThrow("Тай-брейк нельзя завершить вничью")
  })

  it("completes tie-break with a winner", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    let match = createTieBreak(createStandaloneMatch(gameClass), "red")
    match = setTieBreakScore(match, "red", 1)

    const completed = completeTieBreak(match)

    expect(completed.phase).toBe("protocol")
    expect(completed.tieBreaks.at(-1)).toMatchObject({ status: "completed", winner: "red" })
  })
})
