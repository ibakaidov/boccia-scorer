<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue"
import { useRouter } from "vue-router"
import TimerCard from "../components/TimerCard.vue"
import ScoreControls from "../components/ScoreControls.vue"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const router = useRouter()
let interval: number | undefined

const activeEnd = computed(() => store.activeEnd)
const activeScore = computed(() => {
  if (store.match?.phase === "tieBreak") return store.match.tieBreaks.at(-1)
  return activeEnd.value
})
const mainTotals = computed(() => store.mainTotals())
const canEditEnd = computed(() => store.match?.phase === "end" && activeEnd.value?.status === "inProgress")
const canCompleteEnd = computed(() => canEditEnd.value)
const canRunSideTimers = computed(() => store.match?.phase === "end" || store.match?.phase === "tieBreak")
const canPauseTimers = computed(() => {
  if (!store.match || !store.timers) return false
  if (store.match.status === "completed" || store.match.phase === "completed") return false
  if (store.match.phase === "end" || store.match.phase === "tieBreak") return true
  if (store.match.phase === "collectBalls") return store.timers.collectBalls.running
  return false
})

onMounted(() => {
  interval = window.setInterval(() => void store.tick(), 1000)
  window.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
  if (interval) window.clearInterval(interval)
  window.removeEventListener("keydown", handleKeydown)
})

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.tagName === "INPUT" || target?.tagName === "SELECT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return

  if (!canRunSideTimers.value) return

  if (event.code === store.settings.hotkeys.redTimer) {
    event.preventDefault()
    void store.toggleSideTimer("red")
  } else if (event.code === store.settings.hotkeys.blueTimer) {
    event.preventDefault()
    void store.toggleSideTimer("blue")
  } else if (event.code === store.settings.hotkeys.pause) {
    event.preventDefault()
    void store.pauseTimers()
  }
}

async function completeEnd() {
  if (!confirm("Отправить энд? Проверьте счет и использованное время.")) return
  await store.completeEnd()
  if (store.match?.phase === "protocol") {
    await router.push("/protocol")
  }
}

async function nextEnd() {
  await store.nextEnd()
}
</script>

<template>
  <section v-if="store.match && store.timers" class="page match-page">
    <header class="match-header">
      <div>
        <p class="eyebrow">{{ store.scoreboard.currentEndLabel }}</p>
        <h1>{{ store.activeGameClass?.code }} · {{ store.scoreboard.statusLabel }}</h1>
      </div>
      <div class="sync-pill">{{ store.syncLabel }}</div>
    </header>

    <div class="match-grid">
      <TimerCard
        title="Красные"
        :timer="store.timers.redEnd"
        tone="red"
        :disabled="!canRunSideTimers"
        @toggle="store.toggleSideTimer('red')"
      />
      <div class="central-actions">
        <strong>{{ mainTotals.red }} : {{ mainTotals.blue }}</strong>
        <span>Общий счет</span>
        <button type="button" :disabled="!canPauseTimers" @click="store.pauseTimers">Пауза всех таймеров</button>
        <button type="button" class="danger-action" :disabled="!canCompleteEnd" @click="completeEnd">Отправить энд</button>
        <button v-if="store.match.phase === 'collectBalls'" type="button" class="primary-action" @click="nextEnd">
          Следующий энд
        </button>
      </div>
      <TimerCard
        title="Синие"
        :timer="store.timers.blueEnd"
        tone="blue"
        :disabled="!canRunSideTimers"
        @toggle="store.toggleSideTimer('blue')"
      />
    </div>

    <div class="score-row">
      <ScoreControls
        color="red"
        label="Красные"
        :score="activeScore?.redScore ?? 0"
        :total="mainTotals.red"
        :disabled="!canEditEnd"
        @change="store.changeScore('red', $event)"
      />
      <ScoreControls
        color="blue"
        label="Синие"
        :score="activeScore?.blueScore ?? 0"
        :total="mainTotals.blue"
        :disabled="!canEditEnd"
        @change="store.changeScore('blue', $event)"
      />
    </div>

    <footer class="hotkey-strip">Z - красные · M - синие · Space - пауза · счет меняется без подтверждения</footer>
  </section>

  <section v-else class="page narrow-page">
    <h1>Матч не создан</h1>
    <RouterLink class="primary-action" to="/setup">Создать матч</RouterLink>
  </section>
</template>
