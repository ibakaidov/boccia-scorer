import { createRequire } from "node:module"
import { app } from "electron"

const require = createRequire(import.meta.url)
const { autoUpdater, NsisUpdater } = require("electron-updater") as typeof import("electron-updater")

export function configureAutoUpdates(): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  if (autoUpdater instanceof NsisUpdater) {
    autoUpdater.verifyUpdateCodeSignature = async () => null
  }

  autoUpdater.on("error", (error) => {
    console.error("Auto-update check failed", error)
  })

  setTimeout(() => {
    void autoUpdater.checkForUpdatesAndNotify().catch((error: unknown) => {
      console.error("Auto-update check failed", error)
    })
  }, 3000)
}
