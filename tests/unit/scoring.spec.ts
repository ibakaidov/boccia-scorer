import { describe, expect, it } from "vitest"
import { DEFAULT_GAME_CLASSES, calculateMatchTotals, completeCurrentEnd, createStandaloneMatch, setEndScore } from "@shared/domain"

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
})
