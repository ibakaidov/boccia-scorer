<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { createIdleScoreboard } from "@shared/domain"
import type { ScoreboardState } from "@shared/domain"

const state = ref<ScoreboardState>(createIdleScoreboard())
const centerEndLabel = computed(() => (state.value.mode === "idle" ? "-" : state.value.currentEndLabel))
let unsubscribe: (() => void) | undefined

onMounted(() => {
  unsubscribe = window.bocciaApi.scoreboard.onUpdate((next) => {
    state.value = next
  })
})

onBeforeUnmount(() => {
  unsubscribe?.()
})
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
        <div class="board-score">{{ state.red.totalScore }}</div>
      </article>

      <article class="board-center">
        <span>Энд</span>
        <strong>{{ centerEndLabel }}</strong>
      </article>

      <article :class="['board-side', 'blue', { active: state.activeTimer === 'blue' }]">
        <span>{{ state.blue.label }}</span>
        <strong>{{ state.blue.timer.label }}</strong>
        <div class="board-score">{{ state.blue.totalScore }}</div>
      </article>
    </section>

    <footer class="scoreboard-footer">
      <span v-for="end in state.completedEnds" :key="end.index">
        Э{{ end.index }} {{ end.redScore }}:{{ end.blueScore }}
      </span>
      <span v-for="tieBreak in state.tieBreaks" :key="`tb-${tieBreak.index}`">
        ТБ{{ tieBreak.index }} {{ tieBreak.redScore }}:{{ tieBreak.blueScore }}
      </span>
    </footer>
  </main>
</template>
