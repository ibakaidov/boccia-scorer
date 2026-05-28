import type { AppSettings, Dictionaries, Match, SyncQueueItem } from "@shared/domain"

export type HealthResponse = {
  status: "ok"
  serverTime: string
  apiVersion: string
}

export class ApiClient {
  constructor(private readonly settings: AppSettings) {}

  async health(): Promise<HealthResponse> {
    return this.get<HealthResponse>("/health")
  }

  async dictionaries(): Promise<Dictionaries> {
    return this.get<Dictionaries>("/dictionaries")
  }

  async sendQueueItem(item: SyncQueueItem): Promise<void> {
    if (item.type === "startMatch") {
      await this.post("/matches/start", item.payload)
      return
    }

    const matchClientId = encodeURIComponent(item.matchClientId)

    if (item.type === "finishMatch") {
      await this.post(`/matches/${matchClientId}/finish`, item.payload)
      return
    }

    if (item.type === "actionLog") {
      await this.post(`/matches/${matchClientId}/action-log`, item.payload)
      return
    }

    const endIndex = (item.payload as { end?: { index?: number } }).end?.index
    await this.post(`/matches/${matchClientId}/ends/${endIndex ?? 0}`, item.payload)
  }

  async finishMatch(match: Match, finishCode?: string): Promise<void> {
    await this.post(`/matches/${encodeURIComponent(match.clientId)}/finish`, {
      clientEventId: crypto.randomUUID(),
      ...(finishCode ? { finishCode } : {}),
      match,
      completedAt: new Date().toISOString()
    })
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.settings.server.baseUrl}${path}`)
    return parseResponse<T>(response)
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.settings.server.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    return parseResponse<T>(response)
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
