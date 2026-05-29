import { describe, expect, it } from "vitest"

describe("operator color contrast", () => {
  it("keeps score buttons readable", () => {
    expect(contrastRatio("#450a0a", "#fecaca")).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio("#082f49", "#bfdbfe")).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio("#ffffff", "#475569")).toBeGreaterThanOrEqual(4.5)
  })

  it("keeps primary action buttons readable", () => {
    expect(contrastRatio("#ffffff", "#2563eb")).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio("#ffffff", "#dc2626")).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio("#ffffff", "#25344e")).toBeGreaterThanOrEqual(4.5)
  })
})

function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(hexToRgb(foreground))
  const bg = relativeLuminance(hexToRgb(background))
  const lighter = Math.max(fg, bg)
  const darker = Math.min(fg, bg)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "")
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [number, number, number]
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
