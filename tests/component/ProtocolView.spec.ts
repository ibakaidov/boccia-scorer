import { render, screen } from "@testing-library/vue"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_GAME_CLASSES, createStandaloneMatch } from "@shared/domain"
import ProtocolView from "@renderer/operator/views/ProtocolView.vue"
import { useScorerStore } from "@renderer/operator/stores/scorerStore"

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("ProtocolView", () => {
  it("hides tie-break start controls while a tie-break is active", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const match = createStandaloneMatch(gameClass)
    const store = useScorerStore()
    store.match = {
      ...match,
      phase: "tieBreak",
      ends: match.ends.map((end) => ({ ...end, status: "completed", completedAt: "2026-05-29T00:00:00.000Z" })),
      tieBreaks: [
        {
          index: 1,
          firstSide: "red",
          redScore: 0,
          blueScore: 0,
          redTimeUsedSec: 0,
          blueTimeUsedSec: 0,
          status: "inProgress",
          startedAt: "2026-05-29T00:00:00.000Z"
        }
      ]
    }

    render(ProtocolView)

    expect(screen.queryByText("Нужен тай-брейк")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Начать тай-брейк" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Завершить тай-брейк" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Завершить матч без кода" })).toBeDisabled()
  })
})
