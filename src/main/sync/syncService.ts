import { ApiClient } from "@shared/api/client"
import type { SyncQueueItem } from "@shared/domain"
import type { LocalDatabase } from "../storage/database"

export class SyncService {
  constructor(private readonly database: LocalDatabase) {}

  async run(): Promise<SyncQueueItem[]> {
    const settings = this.database.loadSettings()
    const items = this.database
      .listSyncQueue()
      .filter((item) => item.status === "pending" || item.status === "failed")

    if (!settings.server.enabled || items.length === 0) return this.database.listSyncQueue()

    const client = new ApiClient(settings)

    for (const item of items) {
      const sending = {
        ...item,
        status: "sending" as const,
        attempts: item.attempts + 1,
        updatedAt: new Date().toISOString()
      }
      this.database.updateSyncItem(sending)

      try {
        await client.sendQueueItem(item)
        this.database.updateSyncItem({
          ...sending,
          status: "synced",
          lastError: undefined,
          updatedAt: new Date().toISOString()
        })
      } catch (error) {
        this.database.updateSyncItem({
          ...sending,
          status: "failed",
          lastError: error instanceof Error ? error.message : String(error),
          updatedAt: new Date().toISOString()
        })
      }
    }

    return this.database.listSyncQueue()
  }
}
