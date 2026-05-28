import { beforeEach, describe, expect, it, vi } from "vitest"
import { LocalDatabase } from "../../src/main/storage/database"
import type { SyncQueueItem } from "@shared/domain"

const preparedSql: string[] = []

vi.mock("electron", () => ({
  app: {
    getPath: () => "/tmp"
  }
}))

vi.mock("better-sqlite3", () => ({
  default: class MockDatabase {
    pragma() {}
    exec() {}
    prepare(sql: string) {
      preparedSql.push(sql)
      return {
        get: () => undefined,
        run: (params: Record<string, unknown>) => {
          for (const parameter of sql.matchAll(/@(\w+)/g)) {
            const key = parameter[1]
            if (key && !(key in params)) throw new Error(`Missing named parameter "${key}"`)
          }
        },
        all: () => []
      }
    }
  }
}))

beforeEach(() => {
  preparedSql.length = 0
})

describe("LocalDatabase", () => {
  it("uses sync queue SQL parameters that match persisted row keys", () => {
    const database = new LocalDatabase("/tmp/boccia-test.sqlite")
    const item: SyncQueueItem = {
      id: "sync-1",
      matchClientId: "client-match-1",
      type: "sendEnd",
      payload: { end: 1, redScore: 1, blueScore: 0 },
      status: "pending",
      attempts: 0,
      createdAt: "2026-05-29T00:00:00.000Z",
      updatedAt: "2026-05-29T00:00:00.000Z"
    }

    expect(() => database.enqueue(item)).not.toThrow()
    expect(preparedSql).toContain(
      "INSERT OR REPLACE INTO sync_queue (id, match_client_id, type, payload, status, attempts, last_error, created_at, updated_at) VALUES (@id, @match_client_id, @type, @payload, @status, @attempts, @last_error, @created_at, @updated_at)"
    )
  })
})
