import { render, waitFor } from "@testing-library/vue"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ScoreboardApp from "@renderer/scoreboard/ScoreboardApp.vue"
import type { BocciaApi } from "@shared/ipc/api"
import type { ScoreboardState } from "@shared/domain"

const scoreboardState: ScoreboardState = {
  mode: "end",
  theme: "dark",
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
  endProgress: [
    { index: 1, status: "inProgress" },
    { index: 2, status: "notStarted" },
    { index: 3, status: "notStarted" },
    { index: 4, status: "notStarted" }
  ],
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
  it("shows active end score on the main board during play", async () => {
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      const scores = Array.from(container.querySelectorAll(".board-score")).map((item) => item.textContent?.trim())
      expect(scores).toEqual(["1", "2"])
      expect(container.textContent).toContain("Итого: 4")
      expect(container.textContent).toContain("Итого: 0")
      expect(container.querySelectorAll(".scoreboard-end-dot")).toHaveLength(8)
    })
  })

  it("applies the selected scoreboard theme", async () => {
    currentScoreboardState = {
      ...currentScoreboardState,
      theme: "split"
    }
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      expect(container.querySelector(".scoreboard-shell")?.classList.contains("theme-split")).toBe(true)
    })
  })

  it("shows side names instead of color labels", async () => {
    currentScoreboardState = {
      ...currentScoreboardState,
      red: { ...currentScoreboardState.red, label: "Иванов Иван", participantsLabel: "Иванов Иван" },
      blue: { ...currentScoreboardState.blue, label: "Петров Петр", participantsLabel: "Петров Петр" }
    }
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      expect(container.textContent).toContain("Иванов Иван")
      expect(container.textContent).toContain("Петров Петр")
      expect(container.textContent).not.toContain("Красные")
      expect(container.textContent).not.toContain("Синие")
    })
  })

  it("renders six end dots for team matches", async () => {
    currentScoreboardState = {
      ...currentScoreboardState,
      currentEndLabel: "Энд 3 из 6",
      endProgress: [
        { index: 1, status: "completed" },
        { index: 2, status: "completed" },
        { index: 3, status: "inProgress" },
        { index: 4, status: "notStarted" },
        { index: 5, status: "notStarted" },
        { index: 6, status: "notStarted" }
      ]
    }
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      expect(container.querySelectorAll(".scoreboard-end-dot")).toHaveLength(12)
      expect(container.querySelector(".scoreboard-end-progress")?.getAttribute("aria-label")).toBe("Энд 3 из 6")
    })
  })

  it("shows match totals on the main board in protocol", async () => {
    currentScoreboardState = {
      ...currentScoreboardState,
      mode: "protocol"
    }
    const { container } = render(ScoreboardApp)

    await waitFor(() => {
      const scores = Array.from(container.querySelectorAll(".board-score")).map((item) => item.textContent?.trim())
      expect(scores).toEqual(["4*", "0"])
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
          status: "completed"
        },
        {
          index: 2,
          firstSide: "blue",
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
      expect(container.querySelector(".scoreboard-footer")?.textContent).toContain("ТБ1 равноудалено")
      expect(container.querySelector(".scoreboard-footer")?.textContent).toContain("ТБ2 Красные*")
    })
  })
})
