import { join } from "node:path"
import { app, BrowserWindow } from "electron"
import { createWindows, type AppWindows } from "./windows/createWindows"
import { registerHandlers } from "./ipc/registerHandlers"
import { LocalDatabase } from "./storage/database"
import { SyncService } from "./sync/syncService"

let windows: AppWindows | undefined

if (process.env.BOCCIA_ELECTRON_NO_SANDBOX === "1") {
  app.commandLine.appendSwitch("no-sandbox")
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (windows?.operator.isMinimized()) windows.operator.restore()
    windows?.operator.focus()
  })

  void app.whenReady().then(() => {
    const database = new LocalDatabase()
    const syncService = new SyncService(database)
    const preloadPath = join(__dirname, "../preload/index.js")

    windows = createWindows(preloadPath)
    registerHandlers(database, syncService, () => windows?.operator, () => windows?.scoreboard)

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windows = createWindows(preloadPath)
      }
    })
  })
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
