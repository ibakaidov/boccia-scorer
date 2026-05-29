import { calculateMainTotals } from "./scoring"
import { remainingSec } from "./timers"
import type {
  AppSettings,
  Court,
  GameClass,
  Match,
  ScoreboardMode,
  ScoreboardSide,
  ScoreboardState,
  TimerState,
  TimerType,
  TimerView
} from "./types"

export function createIdleScoreboard(settings = "Готов к автономному матчу"): ScoreboardState {
  const emptyTimer = createTimerView({ type: "warmup", maxSec: 0, elapsedSec: 0, running: false })

  return {
    mode: "idle",
    courtName: "Корт не выбран",
    gameClassCode: "-",
    currentEndLabel: "Ожидание",
    red: {
      color: "red",
      label: "Красные",
      timer: emptyTimer,
      endScore: 0,
      totalScore: 0,
      participantsLabel: "Красные"
    },
    blue: {
      color: "blue",
      label: "Синие",
      timer: emptyTimer,
      endScore: 0,
      totalScore: 0,
      participantsLabel: "Синие"
    },
    statusLabel: settings,
    syncLabel: "Автономно",
    completedEnds: [],
    tieBreaks: []
  }
}

export function buildScoreboardState(
  match: Match | undefined,
  timers: Record<TimerType, TimerState> | undefined,
  settings: AppSettings,
  syncLabel: string
): ScoreboardState {
  if (!match || !timers) return createIdleScoreboard()

  const gameClass = settings.gameClasses.find((item) => item.id === match.gameClassId)
  const court = settings.courts.find((item) => item.id === match.courtId)
  const activeScore = getActiveScore(match)
  const totals = calculateMainTotals(match.ends)
  const mode = getScoreboardMode(match.phase)
  const soloTimer = getSoloTimer(mode, timers)
  const activeTimer = timers.redEnd.running ? "red" : timers.blueEnd.running ? "blue" : soloTimer?.running ? "solo" : undefined

  return {
    mode,
    courtName: courtName(court),
    gameClassCode: gameClass?.code ?? "-",
    currentEndLabel: currentEndLabel(match, gameClass),
    red: buildSide("red", activeScore, totals.red, timers.redEnd),
    blue: buildSide("blue", activeScore, totals.blue, timers.blueEnd),
    ...(activeTimer ? { activeTimer } : {}),
    ...(soloTimer ? { soloTimer } : {}),
    statusLabel: statusLabel(match.phase),
    syncLabel,
    completedEnds: match.ends.filter((end) => end.status === "completed"),
    tieBreaks: match.tieBreaks
  }
}

function buildSide(
  color: "red" | "blue",
  activeScore: Pick<Match["ends"][number], "redScore" | "blueScore"> | undefined,
  totalScore: number,
  timer: TimerState
): ScoreboardSide {
  const label = color === "red" ? "Красные" : "Синие"
  return {
    color,
    label,
    timer: createTimerView(timer),
    endScore: color === "red" ? (activeScore?.redScore ?? 0) : (activeScore?.blueScore ?? 0),
    totalScore,
    participantsLabel: label
  }
}

function getActiveScore(match: Match): Pick<Match["ends"][number], "redScore" | "blueScore"> | undefined {
  if (match.phase === "tieBreak") return match.tieBreaks.at(-1)
  if (match.phase === "end") return match.ends[match.activeEndIndex]
  return undefined
}

function createTimerView(timer: TimerState): TimerView {
  return {
    maxSec: timer.maxSec,
    elapsedSec: timer.elapsedSec,
    remainingSec: remainingSec(timer),
    running: timer.running,
    label: formatTimer(remainingSec(timer))
  }
}

function getScoreboardMode(phase: Match["phase"]): ScoreboardMode {
  if (phase === "setup") return "idle"
  if (phase === "completed") return "protocol"
  return phase
}

function getSoloTimer(mode: ScoreboardMode, timers: Record<TimerType, TimerState>): TimerView | undefined {
  if (mode === "warmup") return createTimerView(timers.warmup)
  if (mode === "collectBalls") return createTimerView(timers.collectBalls)
  return undefined
}

function currentEndLabel(match: Match, gameClass: GameClass | undefined): string {
  if (match.phase === "warmup") return "Разминка"
  if (match.phase === "tieBreak") return `Тай-брейк ${match.tieBreaks.length}`
  if (match.phase === "protocol" || match.phase === "completed") return "Протокол"
  return `Энд ${match.activeEndIndex + 1} из ${gameClass?.endsCount ?? match.ends.length}`
}

function statusLabel(phase: Match["phase"]): string {
  const labels: Record<Match["phase"], string> = {
    setup: "Настройка",
    warmup: "Разминка",
    end: "Игра",
    collectBalls: "Сбор мячей",
    tieBreak: "Тай-брейк",
    protocol: "Протокол",
    completed: "Матч завершен"
  }
  return labels[phase]
}

function courtName(court: Court | undefined): string {
  return court?.name ?? "Корт не выбран"
}

export function formatTimer(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
