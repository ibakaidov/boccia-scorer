<script setup lang="ts">
import { computed, ref } from "vue"
import { formatMatchResult } from "@shared/domain"
import { useScorerStore } from "../stores/scorerStore"
import type { SideColor } from "@shared/domain"

const store = useScorerStore()
const firstSide = ref<"red" | "blue">("red")
const error = ref("")
const totals = computed(() => store.mainTotals())
const resultLabel = computed(() => (store.match ? formatMatchResult(store.match) : "0 : 0"))
const protocolEnds = computed(() => store.match?.ends.filter((end) => end.status !== "notStarted") ?? [])
const canStartTieBreak = computed(() => store.match?.phase === "protocol" && store.needsTieBreak())
const canFinishMatch = computed(() => store.match?.phase === "protocol" && !store.needsTieBreak())

async function finish() {
  error.value = ""
  if (!confirm("Завершить матч? В автономном режиме код не требуется.")) return
  try {
    await store.finishMatch()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function completeTieBreak(winner: SideColor) {
  error.value = ""
  try {
    await store.completeTieBreak(winner)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}
</script>

<template>
  <section v-if="store.match" class="page protocol-page">
    <p class="eyebrow">Минимальный протокол</p>
    <h1>{{ resultLabel }}</h1>

    <table class="data-table">
      <thead>
        <tr>
          <th>Энд</th>
          <th>Красные</th>
          <th>Синие</th>
          <th>Время красных</th>
          <th>Время синих</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="end in protocolEnds" :key="end.index">
          <td>{{ end.index }}</td>
          <td>{{ end.redScore }}</td>
          <td>{{ end.blueScore }}</td>
          <td>{{ end.redTimeUsedSec }} сек</td>
          <td>{{ end.blueTimeUsedSec }} сек</td>
        </tr>
      </tbody>
    </table>

    <section v-if="canStartTieBreak" class="warning-panel">
      <strong>Нужен тай-брейк</strong>
      <span>После основных эндов счет равный.</span>
      <select v-model="firstSide">
        <option value="red">Первый мяч: Красные</option>
        <option value="blue">Первый мяч: Синие</option>
      </select>
      <button type="button" class="primary-action" @click="store.startTieBreak(firstSide)">Начать тай-брейк</button>
    </section>

    <section v-if="store.match.phase === 'tieBreak'" class="warning-panel">
      <strong>Тай-брейк {{ store.match.tieBreaks.length }}</strong>
      <span>Основной счет равен: {{ totals.red }} : {{ totals.blue }}. Укажите победителя тай-брейка.</span>
      <div class="button-row">
        <button type="button" class="danger-action" @click="completeTieBreak('red')">Победили красные</button>
        <button type="button" class="primary-action" @click="completeTieBreak('blue')">Победили синие</button>
      </div>
    </section>

    <section v-if="store.match.phase === 'completed'" class="warning-panel">
      <strong>Матч завершен</strong>
      <span>Протокол сохранен. Дальнейшие изменения счета и таймеров заблокированы.</span>
    </section>

    <p v-if="error" class="error-text">{{ error }}</p>
    <button v-if="canFinishMatch" type="button" class="primary-action" @click="finish">
      Завершить матч без кода
    </button>
  </section>
</template>
