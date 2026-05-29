import { fireEvent, render, screen } from "@testing-library/vue"
import { createPinia, setActivePinia } from "pinia"
import { createMemoryHistory, createRouter } from "vue-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_GAME_CLASSES, completeMatch, createStandaloneMatch } from "@shared/domain"
import ProtocolView from "@renderer/operator/views/ProtocolView.vue"
import { useScorerStore } from "@renderer/operator/stores/scorerStore"

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("ProtocolView", () => {
  it("navigates to match controls after starting a tie-break", async () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const match = createStandaloneMatch(gameClass)
    const store = useScorerStore()
    store.match = {
      ...match,
      phase: "protocol",
      ends: match.ends.map((end, index) => ({
        ...end,
        redScore: index % 2 === 0 ? 1 : 0,
        blueScore: index % 2 === 0 ? 0 : 1,
        status: "completed",
        completedAt: "2026-05-29T00:00:00.000Z"
      }))
    }
    vi.spyOn(store, "startTieBreak").mockImplementation(async () => {
      store.match = {
        ...store.match!,
        phase: "tieBreak",
        tieBreaks: [
          {
            index: 1,
            firstSide: "red",
            redScore: 0,
            blueScore: 0,
            redTimeUsedSec: 0,
            blueTimeUsedSec: 0,
            status: "inProgress"
          }
        ]
      }
    })
    const router = createTestRouter()
    const push = vi.spyOn(router, "push")

    render(ProtocolView, { global: { plugins: [router] } })
    await fireEvent.click(screen.getByRole("button", { name: "Начать тай-брейк" }))

    expect(push).toHaveBeenCalledWith("/match")
  })

  it("shows tie-break winner controls while a tie-break is active", () => {
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

    render(ProtocolView, { global: { plugins: [createTestRouter()] } })

    expect(screen.queryByText("Нужен тай-брейк")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Начать тай-брейк" })).not.toBeInTheDocument()
    expect(screen.getByText("Основной счет равен: 0 : 0. Укажите победителя тай-брейка.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Победили красные" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Победили синие" })).toBeEnabled()
    expect(screen.queryByRole("button", { name: "Завершить матч без кода" })).not.toBeInTheDocument()
  })

  it("shows completed status instead of the finish button after match completion", () => {
    const gameClass = DEFAULT_GAME_CLASSES[0]!
    const store = useScorerStore()
    store.match = completeMatch(createStandaloneMatch(gameClass))

    render(ProtocolView, { global: { plugins: [createTestRouter()] } })

    expect(screen.getByText("Матч завершен")).toBeInTheDocument()
    expect(screen.getByText("Протокол сохранен. Дальнейшие изменения счета и таймеров заблокированы.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Завершить матч без кода" })).not.toBeInTheDocument()
  })
})

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/match", component: { template: "<div />" } }
    ]
  })
}
