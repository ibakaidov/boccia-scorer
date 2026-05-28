import type { TimerSettings, TimerState, TimerType } from "./types"

export function createTimer(type: TimerType, maxSec: number): TimerState {
  return {
    type,
    maxSec,
    elapsedSec: 0,
    running: false
  }
}

export function createMatchTimers(endTimeSec: number, settings: TimerSettings): Record<TimerType, TimerState> {
  return {
    warmup: createTimer("warmup", settings.warmupSec),
    collectBalls: createTimer("collectBalls", settings.collectBallsSec),
    penaltyBall: createTimer("penaltyBall", settings.penaltyBallSec),
    technicalTimeout: createTimer("technicalTimeout", settings.technicalTimeoutSec),
    redEnd: createTimer("redEnd", endTimeSec),
    blueEnd: createTimer("blueEnd", endTimeSec)
  }
}

export function remainingSec(timer: TimerState): number {
  return Math.max(0, timer.maxSec - timer.elapsedSec)
}

export function startTimer(timer: TimerState, now = new Date()): TimerState {
  if (timer.running || remainingSec(timer) <= 0) return timer
  return {
    ...timer,
    running: true,
    startedAt: now.toISOString(),
    pausedAt: undefined
  }
}

export function pauseTimer(timer: TimerState, now = new Date()): TimerState {
  if (!timer.running) return timer
  const elapsedSec = calculateElapsed(timer, now)
  return {
    ...timer,
    elapsedSec,
    running: false,
    startedAt: undefined,
    pausedAt: now.toISOString()
  }
}

export function tickTimer(timer: TimerState, now = new Date()): TimerState {
  if (!timer.running) return timer
  const elapsedSec = calculateElapsed(timer, now)
  return {
    ...timer,
    elapsedSec,
    running: elapsedSec < timer.maxSec,
    startedAt: elapsedSec < timer.maxSec ? now.toISOString() : undefined,
    pausedAt: elapsedSec < timer.maxSec ? undefined : now.toISOString()
  }
}

export function adjustTimer(timer: TimerState, elapsedSec: number): TimerState {
  const nextElapsed = clampElapsed(timer, Math.floor(elapsedSec))
  return {
    ...timer,
    elapsedSec: nextElapsed,
    running: timer.running && nextElapsed < timer.maxSec
  }
}

export function resetTimer(timer: TimerState): TimerState {
  return {
    ...timer,
    elapsedSec: 0,
    running: false,
    startedAt: undefined,
    pausedAt: undefined
  }
}

export function toggleExclusiveSideTimer(
  timers: Record<TimerType, TimerState>,
  type: "redEnd" | "blueEnd",
  now = new Date()
): Record<TimerType, TimerState> {
  const other: "redEnd" | "blueEnd" = type === "redEnd" ? "blueEnd" : "redEnd"
  const next = { ...timers }
  next[other] = pauseTimer(next[other], now)
  next[type] = next[type].running ? pauseTimer(next[type], now) : startTimer(next[type], now)
  return next
}

export function pauseAllTimers(
  timers: Record<TimerType, TimerState>,
  now = new Date()
): Record<TimerType, TimerState> {
  return Object.fromEntries(
    Object.entries(timers).map(([type, timer]) => [type, pauseTimer(timer, now)])
  ) as Record<TimerType, TimerState>
}

export function tickRunningTimers(
  timers: Record<TimerType, TimerState>,
  now = new Date()
): Record<TimerType, TimerState> {
  return Object.fromEntries(
    Object.entries(timers).map(([type, timer]) => [type, tickTimer(timer, now)])
  ) as Record<TimerType, TimerState>
}

function calculateElapsed(timer: TimerState, now: Date): number {
  if (!timer.startedAt) return timer.elapsedSec
  const startedAt = new Date(timer.startedAt).getTime()
  const deltaSec = Math.max(0, Math.floor((now.getTime() - startedAt) / 1000))
  return clampElapsed(timer, timer.elapsedSec + deltaSec)
}

function clampElapsed(timer: TimerState, elapsedSec: number): number {
  return Math.min(timer.maxSec, Math.max(0, elapsedSec))
}
