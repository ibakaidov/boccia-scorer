import { render, waitFor } from "@testing-library/vue"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ScoreboardApp from "@renderer/scoreboard/ScoreboardApp.vue"
import type { BocciaApi } from "@shared/ipc/api"
import type { ScoreboardState } from "@shared/domain"

const scoreboardState: ScoreboardState = {
  mode: "end",
  courtName: "Корт 1",
  gameClassCode: "BC1F",
  currentEndLabel: "Энд 1 из 4",
  red: {
    color: "red",
    label: "Красные",
    timer: { maxSec: 270, elapsedSec: 0, remainingSec: 270, running: false, label: "04:30" },
    endScore: 1,
    totalScore: 4,
    participantsLabel: "Красные"
  },
  blue: {
    color: "blue",
    label: "Синие",
    timer: { maxSec: 270, elapsedSec: 0, remainingSec: 270, running: false, label: "04:30" },
    endScore: 2,
    totalScore: 0,
    participantsLabel: "Синие"
  },
  statusLabel: "Игра",
  syncLabel: "Автономно",
  completedEnds: [],
  tieBreaks: []
}

let currentScoreboardState: ScoreboardState

beforeEach(() => {
  currentScoreboardState = structuredClone(scoreboardState)
  window.bocciaApi = {
    scoreboard: {
      onUpdate: vi.fn((handler: (state: ScoreboardState) => void) => {
        handler(currentScoreboardState)
        return () => undefined
      })
    }
  } as unknown as BocciaApi
})

describe("ScoreboardApp", () => {
  it("shows match totals on the main board", async () => {
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      const scores = Array.from(container.querySelectorAll(".board-score")).map((item) => item.textContent?.trim())
      expect(scores).toEqual(["4", "0"])
    })
  })

  it("marks the tie-break winner with a star", async () => {
    currentScoreboardState = {
      ...currentScoreboardState,
      mode: "protocol",
      red: { ...currentScoreboardState.red, totalScore: 2 },
      blue: { ...currentScoreboardState.blue, totalScore: 2 },
      tieBreaks: [
        {
          index: 1,
          firstSide: "red",
          redScore: 0,
          blueScore: 0,
          redTimeUsedSec: 0,
          blueTimeUsedSec: 0,
          winner: "red",
          status: "completed"
        }
      ]
    }
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      const scores = Array.from(container.querySelectorAll(".board-score")).map((item) => item.textContent?.trim())
      expect(scores).toEqual(["2*", "2"])
      expect(container.querySelector(".scoreboard-footer")?.textContent).toContain("ТБ1 Красные*")
    })
  })
})
