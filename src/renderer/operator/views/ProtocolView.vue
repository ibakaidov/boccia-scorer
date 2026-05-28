<script setup lang="ts">
import { computed, ref } from "vue"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const firstSide = ref<"red" | "blue">("red")
const error = ref("")
const totals = computed(() => store.mainTotals())

async function finish() {
  error.value = ""
  if (!confirm("Завершить матч? В автономном режиме код не требуется.")) return
  try {
    await store.finishMatch()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}
</script>

<template>
  <section v-if="store.match" class="page protocol-page">
    <p class="eyebrow">Минимальный протокол</p>
    <h1>{{ totals.red }} : {{ totals.blue }}</h1>

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
        <tr v-for="end in store.match.ends" :key="end.index">
          <td>{{ end.index }}</td>
          <td>{{ end.redScore }}</td>
          <td>{{ end.blueScore }}</td>
          <td>{{ end.redTimeUsedSec }} сек</td>
          <td>{{ end.blueTimeUsedSec }} сек</td>
        </tr>
      </tbody>
    </table>

    <section v-if="store.needsTieBreak()" class="warning-panel">
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
      <div class="button-row">
        <button type="button" @click="store.changeScore('red', -1)">Красные -</button>
        <button type="button" @click="store.changeScore('red', 1)">Красные +</button>
        <button type="button" @click="store.changeScore('blue', -1)">Синие -</button>
        <button type="button" @click="store.changeScore('blue', 1)">Синие +</button>
      </div>
      <button type="button" class="danger-action" @click="store.completeTieBreak">Завершить тай-брейк</button>
    </section>

    <p v-if="error" class="error-text">{{ error }}</p>
    <button type="button" class="primary-action" :disabled="store.needsTieBreak()" @click="finish">
      Завершить матч без кода
    </button>
  </section>
</template>
