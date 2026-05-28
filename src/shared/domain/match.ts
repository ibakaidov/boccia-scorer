import { createId, nowIso } from "./ids"
import type { End, GameClass, Match, Side, SideColor, TieBreakEnd } from "./types"

export function createEnds(count: number): End[] {
  return Array.from({ length: count }, (_, index) => ({
    index: index + 1,
    redScore: 0,
    blueScore: 0,
    redTimeUsedSec: 0,
    blueTimeUsedSec: 0,
    status: "notStarted"
  }))
}

export function createStandaloneMatch(gameClass: GameClass, courtId?: string): Match {
  const createdAt = nowIso()
  const redSide: Side = { color: "red", label: "Красные" }
  const blueSide: Side = { color: "blue", label: "Синие" }

  return {
    id: createId("match"),
    clientId: createId("client-match"),
    status: "draft",
    ...(courtId ? { courtId } : {}),
    gameClassId: gameClass.id,
    redSide,
    blueSide,
    ends: createEnds(gameClass.endsCount),
    tieBreaks: [],
    activeEndIndex: 0,
    phase: "setup",
    createdAt,
    updatedAt: createdAt
  }
}

export function beginWarmup(match: Match): Match {
  return touch({ ...match, status: "active", phase: "warmup" })
}

export function beginEnds(match: Match): Match {
  const ends = match.ends.map((end, index) =>
    index === match.activeEndIndex && end.status === "notStarted"
      ? { ...end, status: "inProgress" as const, startedAt: nowIso() }
      : end
  )

  return touch({ ...match, status: "active", phase: "end", ends })
}

export function setEndScore(match: Match, color: SideColor, value: number): Match {
  const nextValue = Math.max(0, value)
  const ends = match.ends.map((end, index) => {
    if (index !== match.activeEndIndex) return end
    return color === "red" ? { ...end, redScore: nextValue } : { ...end, blueScore: nextValue }
  })

  return touch({ ...match, ends })
}

export function setEndTime(match: Match, color: SideColor, elapsedSec: number): Match {
  const nextValue = Math.max(0, Math.floor(elapsedSec))
  const ends = match.ends.map((end, index) => {
    if (index !== match.activeEndIndex) return end
    return color === "red" ? { ...end, redTimeUsedSec: nextValue } : { ...end, blueTimeUsedSec: nextValue }
  })

  return touch({ ...match, ends })
}

export function completeCurrentEnd(match: Match): Match {
  const completedAt = nowIso()
  const ends = match.ends.map((end, index) =>
    index === match.activeEndIndex ? { ...end, status: "completed" as const, completedAt } : end
  )
  const hasNextEnd = match.activeEndIndex < ends.length - 1

  return touch({
    ...match,
    ends,
    phase: hasNextEnd ? "collectBalls" : "protocol"
  })
}

export function goToNextEnd(match: Match): Match {
  const nextIndex = Math.min(match.activeEndIndex + 1, match.ends.length - 1)
  const ends = match.ends.map((end, index) =>
    index === nextIndex && end.status === "notStarted"
      ? { ...end, status: "inProgress" as const, startedAt: nowIso() }
      : end
  )

  return touch({ ...match, activeEndIndex: nextIndex, phase: "end", ends })
}

export function createTieBreak(match: Match, firstSide: SideColor): Match {
  const tieBreak: TieBreakEnd = {
    index: match.tieBreaks.length + 1,
    firstSide,
    redScore: 0,
    blueScore: 0,
    redTimeUsedSec: 0,
    blueTimeUsedSec: 0,
    status: "inProgress",
    startedAt: nowIso()
  }

  return touch({ ...match, phase: "tieBreak", tieBreaks: [...match.tieBreaks, tieBreak] })
}

export function setTieBreakScore(match: Match, color: SideColor, value: number): Match {
  const nextValue = Math.max(0, value)
  const tieBreaks = match.tieBreaks.map((tieBreak, index) => {
    if (index !== match.tieBreaks.length - 1) return tieBreak
    return color === "red"
      ? { ...tieBreak, redScore: nextValue }
      : { ...tieBreak, blueScore: nextValue }
  })

  return touch({ ...match, tieBreaks })
}

export function setTieBreakTime(match: Match, color: SideColor, elapsedSec: number): Match {
  const nextValue = Math.max(0, Math.floor(elapsedSec))
  const tieBreaks = match.tieBreaks.map((tieBreak, index) => {
    if (index !== match.tieBreaks.length - 1) return tieBreak
    return color === "red"
      ? { ...tieBreak, redTimeUsedSec: nextValue }
      : { ...tieBreak, blueTimeUsedSec: nextValue }
  })

  return touch({ ...match, tieBreaks })
}

export function completeTieBreak(match: Match): Match {
  const activeTieBreak = match.tieBreaks.at(-1)
  if (!activeTieBreak || activeTieBreak.redScore === activeTieBreak.blueScore) {
    throw new Error("Тай-брейк нельзя завершить вничью")
  }

  const tieBreaks = match.tieBreaks.map((tieBreak, index) => {
    if (index !== match.tieBreaks.length - 1) return tieBreak
    const winner: SideColor = tieBreak.redScore > tieBreak.blueScore ? "red" : "blue"
    return {
      ...tieBreak,
      winner,
      status: "completed" as const,
      completedAt: nowIso()
    }
  })

  return touch({ ...match, tieBreaks, phase: "protocol" })
}

export function completeMatch(match: Match): Match {
  const completedAt = nowIso()
  return touch({ ...match, status: "completed", phase: "completed", completedAt })
}

function touch(match: Match): Match {
  return { ...match, updatedAt: nowIso() }
}
