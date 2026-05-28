import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import Database from "better-sqlite3"
import { app } from "electron"
import { DEFAULT_SETTINGS } from "@shared/domain"
import type { ActionLogEntry, AppSettings, Match, MatchSnapshot, SyncQueueItem } from "@shared/domain"
import { settingsSchema } from "@shared/validation/schemas"

type DbRow<T = string> = { payload: T }

export class LocalDatabase {
  private readonly db: Database.Database

  constructor(dbPath = join(app.getPath("userData"), "boccia-scorer-v2.sqlite")) {
    mkdirSync(dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.db.pragma("journal_mode = WAL")
    this.migrate()
  }

  loadSettings(): AppSettings {
    const row = this.db.prepare("SELECT payload FROM settings WHERE key = ?").get("app") as
      | DbRow
      | undefined
    if (!row) return DEFAULT_SETTINGS

    const parsed = settingsSchema.safeParse(JSON.parse(row.payload))
    return parsed.success ? parsed.data : DEFAULT_SETTINGS
  }

  saveSettings(settings: AppSettings): AppSettings {
    const validated = settingsSchema.parse(settings)
    this.db
      .prepare(
        "INSERT INTO settings (key, payload, updated_at) VALUES (@key, @payload, @updatedAt) ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at"
      )
      .run({ key: "app", payload: JSON.stringify(validated), updatedAt: new Date().toISOString() })
    return validated
  }

  resetSettings(): AppSettings {
    return this.saveSettings(DEFAULT_SETTINGS)
  }

  saveSnapshot(snapshot: MatchSnapshot): void {
    this.db
      .prepare(
        "INSERT INTO snapshots (key, payload, saved_at) VALUES (@key, @payload, @savedAt) ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, saved_at = excluded.saved_at"
      )
      .run({ key: "active", payload: JSON.stringify(snapshot), savedAt: snapshot.savedAt })
  }

  saveCompletedMatch(match: Match): void {
    this.db
      .prepare(
        "INSERT INTO match_history (client_id, payload, completed_at) VALUES (@clientId, @payload, @completedAt) ON CONFLICT(client_id) DO UPDATE SET payload = excluded.payload, completed_at = excluded.completed_at"
      )
      .run({
        clientId: match.clientId,
        payload: JSON.stringify(match),
        completedAt: match.completedAt ?? new Date().toISOString()
      })
  }

  listMatchHistory(): Match[] {
    const rows = this.db
      .prepare("SELECT payload FROM match_history ORDER BY completed_at DESC")
      .all() as DbRow[]
    return rows.map((row) => JSON.parse(row.payload) as Match)
  }

  addActionLog(entry: ActionLogEntry): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO action_log (id, match_client_id, at, actor, type, payload) VALUES (@id, @matchClientId, @at, @actor, @type, @payload)"
      )
      .run({
        id: entry.id,
        matchClientId: entry.matchClientId ?? null,
        at: entry.at,
        actor: entry.actor,
        type: entry.type,
        payload: JSON.stringify(entry.payload ?? null)
      })
  }

  listActionLog(matchClientId?: string): ActionLogEntry[] {
    const query = matchClientId
      ? "SELECT * FROM action_log WHERE match_client_id = ? ORDER BY at ASC"
      : "SELECT * FROM action_log ORDER BY at ASC"
    const statement = this.db.prepare(query)
    const rows = (matchClientId ? statement.all(matchClientId) : statement.all()) as Array<{
      id: string
      match_client_id: string | null
      at: string
      actor: "operator" | "system"
      type: string
      payload: string
    }>

    return rows.map((row) => ({
      id: row.id,
      ...(row.match_client_id ? { matchClientId: row.match_client_id } : {}),
      at: row.at,
      actor: row.actor,
      type: row.type,
      payload: JSON.parse(row.payload)
    }))
  }

  enqueue(item: SyncQueueItem): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO sync_queue (id, match_client_id, type, payload, status, attempts, last_error, created_at, updated_at) VALUES (@id, @match_client_id, @type, @payload, @status, @attempts, @last_error, @created_at, @updated_at)"
      )
      .run(toSyncRow(item))
  }

  listSyncQueue(): SyncQueueItem[] {
    const rows = this.db.prepare("SELECT * FROM sync_queue ORDER BY created_at ASC").all() as SyncRow[]
    return rows.map(fromSyncRow)
  }

  updateSyncItem(item: SyncQueueItem): void {
    this.enqueue(item)
  }

  countSync(status: "pending" | "failed"): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = ?")
      .get(status) as { count: number }
    return row.count
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        saved_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS match_history (
        client_id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        completed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS action_log (
        id TEXT PRIMARY KEY,
        match_client_id TEXT,
        at TEXT NOT NULL,
        actor TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        match_client_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER NOT NULL,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)
    this.saveSettings(this.loadSettings())
  }
}

type SyncRow = {
  id: string
  match_client_id: string
  type: SyncQueueItem["type"]
  payload: string
  status: SyncQueueItem["status"]
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

function toSyncRow(item: SyncQueueItem): SyncRow {
  return {
    id: item.id,
    match_client_id: item.matchClientId,
    type: item.type,
    payload: JSON.stringify(item.payload),
    status: item.status,
    attempts: item.attempts,
    last_error: item.lastError ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  }
}

function fromSyncRow(row: SyncRow): SyncQueueItem {
  return {
    id: row.id,
    matchClientId: row.match_client_id,
    type: row.type,
    payload: JSON.parse(row.payload),
    status: row.status,
    attempts: row.attempts,
    ...(row.last_error ? { lastError: row.last_error } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
