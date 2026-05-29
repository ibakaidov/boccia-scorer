import { spawn } from "node:child_process"
import http from "node:http"
import { chromium } from "playwright"

const port = Number(process.env.BOCCIA_CDP_PORT ?? 9222)
const baseUrl = `http://127.0.0.1:${port}`
const operatorViewports = [
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080]
]
const scoreboardViewports = [
  [1024, 768],
  [1280, 720],
  [1920, 1080]
]
let devProcess

process.env.NO_PROXY = "127.0.0.1,localhost"
process.env.no_proxy = "127.0.0.1,localhost"

try {
  await ensureElectron()
  const browser = await chromium.connectOverCDP(baseUrl)
  const pages = browser.contexts().flatMap((context) => context.pages())
  const operator = pages.find((page) => page.url().includes("localhost:5173") && !page.url().includes("scoreboard"))
  const scoreboard = pages.find((page) => page.url().includes("scoreboard.html"))

  if (!operator || !scoreboard) {
    throw new Error("Не найдены оба Electron-окна")
  }

  operator.on("dialog", async (dialog) => dialog.accept())

  const failures = []
  await checkPage(failures, "operator-dashboard", operator, operatorViewports)
  await checkPage(failures, "scoreboard-idle", scoreboard, scoreboardViewports)

  await startMatch(operator, "bc1f")
  await checkPage(failures, "operator-warmup", operator, operatorViewports)
  await checkPage(failures, "scoreboard-warmup", scoreboard, scoreboardViewports)

  await operator.getByRole("button", { name: "Перейти к эндам" }).click()
  await operator.waitForURL(/#\/match/)
  await checkPage(failures, "operator-end", operator, operatorViewports)
  await checkPage(failures, "scoreboard-end", scoreboard, scoreboardViewports)

  await plus(operator, "red", 1)
  await operator.getByRole("button", { name: "Перейти к сбору мячей" }).click()
  await operator.waitForTimeout(200)
  await checkPage(failures, "operator-collect-balls", operator, operatorViewports)
  await checkPage(failures, "scoreboard-collect-balls", scoreboard, scoreboardViewports)

  await operator.getByRole("button", { name: "Начать следующий энд" }).click()
  await plus(operator, "blue", 1)
  await operator.getByRole("button", { name: "Перейти к сбору мячей" }).click()
  await operator.getByRole("button", { name: "Начать следующий энд" }).click()
  await plus(operator, "red", 1)
  await operator.getByRole("button", { name: "Перейти к сбору мячей" }).click()
  await operator.getByRole("button", { name: "Начать следующий энд" }).click()
  await plus(operator, "blue", 1)
  await operator.getByRole("button", { name: "Перейти к сбору мячей" }).click()
  await operator.waitForURL(/#\/protocol/)
  await operator.getByRole("button", { name: "Начать тай-брейк" }).click()
  await operator.waitForURL(/#\/match/)
  await checkPage(failures, "operator-tie-break", operator, operatorViewports)
  await checkPage(failures, "scoreboard-tie-break", scoreboard, scoreboardViewports)

  await browser.close()

  if (failures.length > 0) {
    console.error(`\nПереполнение: найдено нарушений: ${failures.length}`)
    for (const failure of failures) {
      console.error(
        `${failure.scenario} ${failure.viewport} :: ${failure.kind} :: ${failure.selector} :: "${failure.text}" :: ${failure.details}`
      )
    }
    process.exitCode = 1
  } else {
    console.log("Переполнение: нарушений не найдено")
  }
} finally {
  if (devProcess) {
    devProcess.kill()
  }
}

async function ensureElectron() {
  if (await hasTargets()) return
  devProcess = spawn("env", ["-u", "NODE_OPTIONS", "npm", "run", "dev", "--", `--remote-debugging-port=${port}`], {
    cwd: process.cwd(),
    env: { ...process.env, NO_PROXY: "127.0.0.1,localhost", no_proxy: "127.0.0.1,localhost" },
    stdio: "ignore"
  })
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (await hasTargets()) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error("Electron не поднял DevTools target за 60 секунд")
}

async function hasTargets() {
  try {
    const targets = await getJson("/json/list")
    return targets.some((target) => target.url?.includes("localhost:5173"))
  } catch {
    return false
  }
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const request = http.get({ host: "127.0.0.1", port, path }, (response) => {
      let body = ""
      response.setEncoding("utf8")
      response.on("data", (chunk) => {
        body += chunk
      })
      response.on("end", () => {
        if (response.statusCode !== 200) {
          reject(new Error(`DevTools HTTP ${response.statusCode}`))
          return
        }
        resolve(JSON.parse(body))
      })
    })
    request.on("error", reject)
    request.setTimeout(1000, () => {
      request.destroy(new Error("DevTools timeout"))
    })
  })
}

async function startMatch(operator, gameClassId) {
  await operator.goto("http://localhost:5173/#/setup")
  await operator.locator("select").nth(0).selectOption(gameClassId)
  await operator.getByRole("button", { name: /Создать матч/ }).click()
  await operator.waitForURL(/#\/warmup/)
}

async function plus(operator, color, count) {
  for (let index = 0; index < count; index += 1) {
    await operator.locator(`.score-card.${color}`).getByRole("button", { name: "Увеличить счет" }).click()
  }
}

async function checkPage(failures, scenario, page, viewports) {
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(100)
    const results = await page.evaluate(collectOverflowResults)
    const viewport = `${width}x${height}`
    failures.push(...results.map((item) => ({ scenario, viewport, ...item })))
    console.log(`${scenario} ${viewport}: нарушений ${results.length}`)
  }
}

function collectOverflowResults() {
  const failures = []
  const tolerance = 2
  const bodyOverflow = document.body.scrollWidth - document.body.clientWidth

  if (bodyOverflow > tolerance) {
    failures.push({
      kind: "page-horizontal-overflow",
      selector: "body",
      text: "",
      details: `scrollWidth ${document.body.scrollWidth}, clientWidth ${document.body.clientWidth}`
    })
  }

  for (const element of Array.from(document.querySelectorAll("body *")).filter(isVisible).filter(hasOwnReadableText)) {
    const rect = element.getBoundingClientRect()
    const text = readableText(element)
    const ownHorizontalOverflow = element.scrollWidth - element.clientWidth

    if (ownHorizontalOverflow > tolerance) {
      failures.push({
        kind: "text-horizontal-overflow",
        selector: selectorFor(element),
        text,
        details: `scrollWidth ${element.scrollWidth}, clientWidth ${element.clientWidth}`
      })
      continue
    }

    const frame = closestFrame(element)
    if (frame && frame !== element) {
      const frameRect = frame.getBoundingClientRect()
      const outside = rect.left < frameRect.left - tolerance || rect.right > frameRect.right + tolerance || rect.top < frameRect.top - tolerance || rect.bottom > frameRect.bottom + tolerance
      if (outside) {
        failures.push({
          kind: "text-outside-frame",
          selector: selectorFor(element),
          text,
          details: `text rect ${formatRect(rect)}, frame ${selectorFor(frame)} ${formatRect(frameRect)}`
        })
      }
    }
  }

  return failures

  function isVisible(element) {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 && !element.classList.contains("sr-only")
  }

  function hasOwnReadableText(element) {
    if (["SCRIPT", "STYLE"].includes(element.tagName)) return false
    const text = readableText(element)
    if (!text) return false
    const childrenWithText = Array.from(element.children).filter((child) => isVisible(child) && readableText(child))
    return childrenWithText.length === 0 || ["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)
  }

  function readableText(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value || element.placeholder || ""
    if (element instanceof HTMLSelectElement) return element.selectedOptions[0]?.textContent?.trim() ?? ""
    return element.textContent?.replace(/\s+/g, " ").trim() ?? ""
  }

  function closestFrame(element) {
    return element.closest(
      ".timer-card,.score-card,.central-actions,.board-side,.board-center,.solo-board,.scoreboard-top,.scoreboard-footer,.status-card,.metric-card,.panel-form,.warning-panel,nav,.side-nav,.match-header,button,a"
    )
  }

  function selectorFor(element) {
    const classes = Array.from(element.classList).slice(0, 3).join(".")
    return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`
  }

  function formatRect(rect) {
    return `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`
  }
}
