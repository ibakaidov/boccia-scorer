<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { createIdleScoreboard } from "@shared/domain"
import type { ScoreboardState, SideColor, TieBreakEnd } from "@shared/domain"

const state = ref<ScoreboardState>(createIdleScoreboard())
const centerEndLabel = computed(() => (state.value.mode === "idle" ? "-" : state.value.currentEndLabel))
const redScoreLabel = computed(() => scoreLabel("red"))
const blueScoreLabel = computed(() => scoreLabel("blue"))
let unsubscribe: (() => void) | undefined

onMounted(() => {
  unsubscribe = window.bocciaApi.scoreboard.onUpdate((next) => {
    state.value = next
  })
})

onBeforeUnmount(() => {
  unsubscribe?.()
})

function scoreLabel(color: SideColor): string {
  const side = color === "red" ? state.value.red : state.value.blue
  return `${side.totalScore}${scoreboardWinner() === color ? "*" : ""}`
}

function scoreboardWinner(): SideColor | undefined {
  const tieBreakWinner = getLatestTieBreakWinner(state.value.tieBreaks)
  if (tieBreakWinner) return tieBreakWinner
  if (state.value.mode !== "protocol") return undefined
  if (state.value.red.totalScore === state.value.blue.totalScore) return undefined
  return state.value.red.totalScore > state.value.blue.totalScore ? "red" : "blue"
}

function getLatestTieBreakWinner(tieBreaks: TieBreakEnd[]): SideColor | undefined {
  for (let index = tieBreaks.length - 1; index >= 0; index -= 1) {
    const winner = tieBreaks[index]?.winner
    if (winner) return winner
  }
  return undefined
}

function tieBreakLabel(tieBreak: TieBreakEnd): string {
  if (tieBreak.winner === "red") return `ТБ${tieBreak.index} Красные*`
  if (tieBreak.winner === "blue") return `ТБ${tieBreak.index} Синие*`
  return `ТБ${tieBreak.index}`
}
</script>

<template>
  <main :class="['scoreboard-shell', state.mode]">
    <header class="scoreboard-top">
      <span>{{ state.courtName }}</span>
      <strong>{{ state.gameClassCode }}</strong>
      <span>{{ state.currentEndLabel }}</span>
    </header>

    <section v-if="state.soloTimer" class="solo-board">
      <span>{{ state.statusLabel }}</span>
      <strong>{{ state.soloTimer.label }}</strong>
    </section>

    <section v-else class="side-board-grid">
      <article :class="['board-side', 'red', { active: state.activeTimer === 'red' }]">
        <span>{{ state.red.label }}</span>
        <strong>{{ state.red.timer.label }}</strong>
        <div class="board-score">{{ redScoreLabel }}</div>
      </article>

      <article class="board-center">
        <span>Энд</span>
        <strong>{{ centerEndLabel }}</strong>
      </article>

      <article :class="['board-side', 'blue', { active: state.activeTimer === 'blue' }]">
        <span>{{ state.blue.label }}</span>
        <strong>{{ state.blue.timer.label }}</strong>
        <div class="board-score">{{ blueScoreLabel }}</div>
      </article>
    </section>

    <footer class="scoreboard-footer">
      <span v-for="end in state.completedEnds" :key="end.index">
        Э{{ end.index }} {{ end.redScore }}:{{ end.blueScore }}
      </span>
      <span v-for="tieBreak in state.tieBreaks" :key="`tb-${tieBreak.index}`">
        {{ tieBreakLabel(tieBreak) }}
      </span>
    </footer>
  </main>
</template>
