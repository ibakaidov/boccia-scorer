import { spawn } from "node:child_process"
import http from "node:http"
import { chromium } from "playwright"

const port = Number(process.env.BOCCIA_CDP_PORT ?? 9222)
const baseUrl = `http://127.0.0.1:${port}`
const allowedLowContrastTexts = new Set(["BC"])
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
  await checkScenario(failures, "operator-dashboard", operator)
  await checkScenario(failures, "scoreboard-idle", scoreboard)

  await startMatch(operator, "bc1f")
  await checkScenario(failures, "operator-warmup", operator)
  await checkScenario(failures, "scoreboard-warmup", scoreboard)

  await operator.getByRole("button", { name: "Перейти к эндам" }).click()
  await operator.waitForURL(/#\/match/)
  await checkScenario(failures, "operator-end", operator)
  await checkScenario(failures, "scoreboard-end", scoreboard)

  await plus(operator, "red", 1)
  await operator.getByRole("button", { name: "Перейти к сбору мячей" }).click()
  await operator.waitForTimeout(200)
  await checkScenario(failures, "operator-collect-balls", operator)
  await checkScenario(failures, "scoreboard-collect-balls", scoreboard)

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
  await checkScenario(failures, "operator-tie-break", operator)
  await checkScenario(failures, "scoreboard-tie-break", scoreboard)

  await browser.close()

  if (failures.length > 0) {
    console.error(`\nКонтраст: найдено нарушений: ${failures.length}`)
    for (const failure of failures) {
      console.error(
        `${failure.scenario} :: ${failure.selector} :: "${failure.text}" :: ${failure.ratio.toFixed(2)} < ${failure.threshold} :: fg ${failure.foreground} bg ${failure.background}`
      )
    }
    process.exitCode = 1
  } else {
    console.log("Контраст: нарушений не найдено")
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
    const targets = await getJson(`/json/list`)
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

async function checkScenario(failures, scenario, page) {
  const results = await page.evaluate(collectContrastResults)
  const scenarioFailures = results.filter((item) => item.ratio < item.threshold && !allowedLowContrastTexts.has(item.text))
  failures.push(...scenarioFailures.map((item) => ({ scenario, ...item })))
  console.log(`${scenario}: проверено ${results.length}, нарушений ${scenarioFailures.length}`)
}

function collectContrastResults() {
  const elements = Array.from(document.querySelectorAll("body *"))
    .filter(isVisible)
    .filter(hasOwnReadableText)

  return elements.map((element) => {
    const style = getComputedStyle(element)
    const foreground = parseColor(style.color)
    const background = effectiveBackground(element)
    const ratio = contrastRatio(foreground, background)
    const threshold = contrastThreshold(style, element)

    return {
      selector: selectorFor(element),
      text: readableText(element),
      foreground: colorString(foreground),
      background: colorString(background),
      ratio,
      threshold
    }
  })

  function isVisible(element) {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0
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

  function effectiveBackground(element) {
    let color = { r: 5, g: 11, b: 20, a: 1 }
    const chain = []
    for (let current = element; current; current = current.parentElement) {
      chain.push(current)
    }
    for (const current of chain.reverse()) {
      const background = parseColor(getComputedStyle(current).backgroundColor)
      color = blend(background, color)
    }
    return color
  }

  function parseColor(value) {
    const match = value.match(/rgba?\(([^)]+)\)/)
    if (!match) return { r: 0, g: 0, b: 0, a: 0 }
    const [r, g, b, a = "1"] = match[1].split(",").map((part) => part.trim())
    return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) }
  }

  function blend(top, bottom) {
    const alpha = top.a + bottom.a * (1 - top.a)
    if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 }
    return {
      r: Math.round((top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha),
      g: Math.round((top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha),
      b: Math.round((top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha),
      a: alpha
    }
  }

  function contrastRatio(foreground, background) {
    const fg = relativeLuminance(foreground)
    const bg = relativeLuminance(background)
    const lighter = Math.max(fg, bg)
    const darker = Math.min(fg, bg)
    return (lighter + 0.05) / (darker + 0.05)
  }

  function relativeLuminance({ r, g, b }) {
    const [red, green, blue] = [r, g, b].map((channel) => {
      const value = channel / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }

  function contrastThreshold(style, element) {
    if (element.matches(":disabled")) return 3
    const fontSize = Number.parseFloat(style.fontSize)
    const fontWeight = Number.parseInt(style.fontWeight, 10) || 400
    return fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5
  }

  function colorString({ r, g, b, a }) {
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})`
  }

  function selectorFor(element) {
    const classes = Array.from(element.classList).slice(0, 3).join(".")
    return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`
  }
}
