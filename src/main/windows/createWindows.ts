import { join } from "node:path"
import { BrowserWindow, screen, shell, type WebPreferences } from "electron"

export type AppWindows = {
  operator: BrowserWindow
  scoreboard: BrowserWindow
}

export function createWindows(preloadPath: string): AppWindows {
  const displays = screen.getAllDisplays()
  const secondaryDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0)

  const operator = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: "Boccia Scorer v2",
    webPreferences: secureWebPreferences(preloadPath)
  })

  const scoreboard = new BrowserWindow({
    width: 1280,
    height: 720,
    ...(secondaryDisplay ? { x: secondaryDisplay.bounds.x, y: secondaryDisplay.bounds.y } : {}),
    title: "Табло Boccia Scorer v2",
    backgroundColor: "#07111f",
    webPreferences: secureWebPreferences(preloadPath)
  })

  for (const window of [operator, scoreboard]) {
    window.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url)
      return { action: "deny" }
    })
  }

  loadOperator(operator)
  loadScoreboard(scoreboard)

  return { operator, scoreboard }
}

function secureWebPreferences(preloadPath: string): WebPreferences {
  return {
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,
    webSecurity: true
  }
}

function loadOperator(window: BrowserWindow): void {
  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
    return
  }
  void window.loadFile(join(__dirname, "../renderer/index.html"))
}

function loadScoreboard(window: BrowserWindow): void {
  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(`${process.env.ELECTRON_RENDERER_URL}/scoreboard.html`)
    return
  }
  void window.loadFile(join(__dirname, "../renderer/scoreboard.html"))
}
