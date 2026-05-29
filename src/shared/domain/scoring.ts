import type { End, Match, SideColor, TieBreakEnd } from "./types"

export type MatchTotals = {
  red: number
  blue: number
  tied: boolean
  winner?: SideColor
  tieBreakWinner?: SideColor
}

export function calculateMainTotals(ends: End[]): Pick<MatchTotals, "red" | "blue" | "tied"> {
  const completedEnds = ends.filter((end) => end.status === "completed")
  const red = completedEnds.reduce((sum, end) => sum + end.redScore, 0)
  const blue = completedEnds.reduce((sum, end) => sum + end.blueScore, 0)

  return { red, blue, tied: red === blue }
}

export function getLatestTieBreakWinner(tieBreaks: TieBreakEnd[]): SideColor | undefined {
  for (let index = tieBreaks.length - 1; index >= 0; index -= 1) {
    const winner = tieBreaks[index]?.winner
    if (winner) return winner
  }
  return undefined
}

export function calculateMatchTotals(match: Match): MatchTotals {
  const mainTotals = calculateMainTotals(match.ends)
  const tieBreakWinner = getLatestTieBreakWinner(match.tieBreaks)
  const winner = mainTotals.tied ? tieBreakWinner : mainTotals.red > mainTotals.blue ? "red" : "blue"

  return {
    ...mainTotals,
    ...(winner ? { winner } : {}),
    ...(tieBreakWinner ? { tieBreakWinner } : {})
  }
}

export function formatMatchResult(match: Match): string {
  const totals = calculateMatchTotals(match)
  const red = `${totals.red}${totals.winner === "red" ? "*" : ""}`
  const blue = `${totals.blue}${totals.winner === "blue" ? "*" : ""}`
  const tieBreakLabel = totals.tieBreakWinner ? ", ТБ" : ""

  return `${red} : ${blue}${tieBreakLabel}`
}

export function allMainEndsCompleted(match: Match): boolean {
  return match.ends.every((end) => end.status === "completed")
}

export function needsTieBreak(match: Match): boolean {
  const totals = calculateMainTotals(match.ends)
  return allMainEndsCompleted(match) && totals.tied && !getLatestTieBreakWinner(match.tieBreaks)
}
