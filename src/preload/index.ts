import { contextBridge, ipcRenderer } from "electron"
import type { ActionLogEntry, AppSettings, Match, MatchSnapshot, ScoreboardState, SyncQueueItem } from "@shared/domain"
import { IPC_CHANNELS, type BocciaApi } from "@shared/ipc/api"

const api: BocciaApi = {
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.appGetVersion),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.appGetStatus)
  },
  settings: {
    load: () => ipcRenderer.invoke(IPC_CHANNELS.settingsLoad),
    save: (settings: AppSettings) => ipcRenderer.invoke(IPC_CHANNELS.settingsSave, settings),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.settingsReset)
  },
  match: {
    saveSnapshot: (snapshot: MatchSnapshot) => ipcRenderer.invoke(IPC_CHANNELS.matchSaveSnapshot, snapshot),
    complete: (match: Match) => ipcRenderer.invoke(IPC_CHANNELS.matchComplete, match),
    listHistory: () => ipcRenderer.invoke(IPC_CHANNELS.matchListHistory)
  },
  actionLog: {
    add: (entry: ActionLogEntry) => ipcRenderer.invoke(IPC_CHANNELS.actionLogAdd, entry),
    list: (matchClientId?: string) => ipcRenderer.invoke(IPC_CHANNELS.actionLogList, matchClientId)
  },
  sync: {
    enqueue: (item: SyncQueueItem) => ipcRenderer.invoke(IPC_CHANNELS.syncEnqueue, item),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.syncList),
    run: () => ipcRenderer.invoke(IPC_CHANNELS.syncRun)
  },
  scoreboard: {
    update: (state: ScoreboardState) => ipcRenderer.invoke(IPC_CHANNELS.scoreboardUpdate, state),
    onUpdate: (handler: (state: ScoreboardState) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: ScoreboardState): void => handler(state)
      ipcRenderer.on(IPC_CHANNELS.scoreboardPush, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.scoreboardPush, listener)
    }
  }
}

contextBridge.exposeInMainWorld("bocciaApi", api)
