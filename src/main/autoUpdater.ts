import { app } from "electron"
import { autoUpdater, NsisUpdater } from "electron-updater"

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
