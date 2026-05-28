import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useScorerStore } from "@renderer/operator/stores/scorerStore"
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
      getStatus: vi.fn()
    },
    settings: {
      load: vi.fn(),
      save: vi.fn(),
      reset: vi.fn()
    },
    match: {
      saveSnapshot: cloneCheckedMock(),
      complete: cloneCheckedMock(),
      listHistory: vi.fn(() => Promise.resolve([]))
    },
    actionLog: {
      add: cloneCheckedMock(),
      list: vi.fn()
    },
    sync: {
      enqueue: cloneCheckedMock(),
      list: vi.fn(),
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
})
