import { describe, expect, it } from "vitest"
import { createTimer, pauseTimer, remainingSec, startTimer, tickTimer, toggleExclusiveSideTimer, createMatchTimers, DEFAULT_TIMER_SETTINGS } from "@shared/domain"

describe("timers", () => {
  it("stores elapsed time and derives remaining time", () => {
    const timer = startTimer(createTimer("redEnd", 10), new Date("2026-05-23T12:00:00.000Z"))
    const ticked = tickTimer(timer, new Date("2026-05-23T12:00:04.000Z"))

    expect(ticked.elapsedSec).toBe(4)
    expect(remainingSec(ticked)).toBe(6)
  })

  it("runs only one side timer", () => {
    let timers = createMatchTimers(60, DEFAULT_TIMER_SETTINGS)
    timers = toggleExclusiveSideTimer(timers, "redEnd", new Date("2026-05-23T12:00:00.000Z"))
    timers = toggleExclusiveSideTimer(timers, "blueEnd", new Date("2026-05-23T12:00:05.000Z"))

    expect(timers.redEnd.running).toBe(false)
    expect(timers.blueEnd.running).toBe(true)
    expect(pauseTimer(timers.redEnd).elapsedSec).toBe(5)
  })
})
