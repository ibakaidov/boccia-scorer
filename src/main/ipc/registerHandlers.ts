import { app, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from "electron"
import { DEFAULT_SETTINGS, type ScoreboardState } from "@shared/domain"
import { IPC_CHANNELS } from "@shared/ipc/api"
import { settingsSchema } from "@shared/validation/schemas"
import type { LocalDatabase } from "../storage/database"
import type { SyncService } from "../sync/syncService"

export function registerHandlers(
  database: LocalDatabase,
  syncService: SyncService,
  getOperatorWindow: () => BrowserWindow | undefined,
  getScoreboardWindow: () => BrowserWindow | undefined
): void {
  let latestScoreboardState: ScoreboardState | undefined

  ipcMain.handle(IPC_CHANNELS.appGetVersion, () => app.getVersion())
  ipcMain.handle(IPC_CHANNELS.appGetStatus, () => ({
    appVersion: app.getVersion(),
    serverOnline: false,
    pendingSync: database.countSync("pending"),
    failedSync: database.countSync("failed")
  }))

  ipcMain.handle(IPC_CHANNELS.settingsLoad, () => database.loadSettings())
  ipcMain.handle(IPC_CHANNELS.settingsSave, (event, payload) => {
    ensureOperator(event, getOperatorWindow)
    return database.saveSettings(settingsSchema.parse(payload))
  })
  ipcMain.handle(IPC_CHANNELS.settingsReset, (event) => {
    ensureOperator(event, getOperatorWindow)
    return database.saveSettings(DEFAULT_SETTINGS)
  })

  ipcMain.handle(IPC_CHANNELS.matchSaveSnapshot, (event, snapshot) => {
    ensureOperator(event, getOperatorWindow)
    database.saveSnapshot(snapshot)
  })

  ipcMain.handle(IPC_CHANNELS.matchLoadSnapshot, () => database.loadSnapshot())

  ipcMain.handle(IPC_CHANNELS.matchComplete, (event, match) => {
    ensureOperator(event, getOperatorWindow)
    database.saveCompletedMatch(match)
  })

  ipcMain.handle(IPC_CHANNELS.matchListHistory, () => database.listMatchHistory())

  ipcMain.handle(IPC_CHANNELS.actionLogAdd, (event, entry) => {
    ensureOperator(event, getOperatorWindow)
    database.addActionLog(entry)
  })

  ipcMain.handle(IPC_CHANNELS.actionLogList, (_event, matchClientId?: string) => database.listActionLog(matchClientId))

  ipcMain.handle(IPC_CHANNELS.syncEnqueue, (event, item) => {
    ensureOperator(event, getOperatorWindow)
    database.enqueue(item)
  })

  ipcMain.handle(IPC_CHANNELS.syncList, () => database.listSyncQueue())
  ipcMain.handle(IPC_CHANNELS.syncRun, (event) => {
    ensureOperator(event, getOperatorWindow)
    return syncService.run()
  })

  ipcMain.handle(IPC_CHANNELS.scoreboardUpdate, (event, state: ScoreboardState) => {
    ensureOperator(event, getOperatorWindow)
    latestScoreboardState = state
    getScoreboardWindow()?.webContents.send(IPC_CHANNELS.scoreboardPush, state)
  })

  getScoreboardWindow()?.webContents.on("did-finish-load", () => {
    if (latestScoreboardState) {
      getScoreboardWindow()?.webContents.send(IPC_CHANNELS.scoreboardPush, latestScoreboardState)
    }
  })
}

function ensureOperator(
  event: IpcMainInvokeEvent,
  getOperatorWindow: () => BrowserWindow | undefined
): void {
  if (event.sender.id !== getOperatorWindow()?.webContents.id) {
    throw new Error("IPC command is allowed only from operator window")
  }
}
