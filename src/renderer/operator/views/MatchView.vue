<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { formatTimer } from "@shared/domain"
import type { SideColor } from "@shared/domain"
import EndProgress from "../components/EndProgress.vue"
import TimerCard from "../components/TimerCard.vue"
import ScoreControls from "../components/ScoreControls.vue"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const router = useRouter()
const nextTieBreakFirstSide = ref<SideColor>("red")
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
const isCollectBalls = computed(() => store.match?.phase === "collectBalls")
const collectBallsLabel = computed(() => {
  if (!store.timers) return "01:00"
  return formatTimer(store.timers.collectBalls.maxSec - store.timers.collectBalls.elapsedSec)
})
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
  if (!confirm("Перейти к сбору мячей? Проверьте счет и использованное время.")) return
  await store.completeEnd()
  if (store.match?.phase === "protocol") {
    await router.push("/protocol")
  }
}

async function nextEnd() {
  await store.nextEnd()
}

async function finishTieBreak(winner: SideColor) {
  const label = winner === "red" ? "победа красных" : "победа синих"
  if (!confirm(`Завершить тай-брейк: ${label}?`)) return
  await store.completeTieBreak(winner)
  if (store.match?.phase === "protocol") {
    await router.push("/protocol")
  }
}

async function continueTieBreak() {
  if (!confirm("Положение равноудалено? Начать дополнительный тай-брейк?")) return
  await store.continueTieBreak(nextTieBreakFirstSide.value)
}
</script>

<template>
  <section v-if="store.match && store.timers" class="page match-page">
    <header class="match-header">
      <div>
        <EndProgress :ends="store.match.ends" :active-index="store.match.activeEndIndex" />
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
        <template v-if="isCollectBalls">
          <span class="phase-label">Сбор мячей</span>
          <strong class="collect-timer">{{ collectBallsLabel }}</strong>
          <span>До начала следующего энда</span>
          <button type="button" @click="store.toggleCollectBallsTimer">
            {{ store.timers.collectBalls.running ? "Остановить часы" : "Продолжить сбор" }}
          </button>
          <button type="button" class="primary-action" @click="nextEnd">Начать следующий энд</button>
        </template>
        <template v-else-if="store.match.phase === 'tieBreak'">
          <span class="phase-label">Тай-брейк {{ store.match.tieBreaks.length }}</span>
          <strong>{{ mainTotals.red }} : {{ mainTotals.blue }}</strong>
          <span>Основной счет</span>
          <button type="button" :disabled="!canPauseTimers" @click="store.pauseTimers">Остановить часы</button>
          <div class="tie-break-actions">
            <button type="button" class="danger-action" @click="finishTieBreak('red')">Победа красных</button>
            <button type="button" class="primary-action" @click="finishTieBreak('blue')">Победа синих</button>
          </div>
          <label class="compact-field">
            Первый мяч следующего тай-брейка
            <select v-model="nextTieBreakFirstSide">
              <option value="red">Красные</option>
              <option value="blue">Синие</option>
            </select>
          </label>
          <button type="button" class="secondary-action" @click="continueTieBreak">Равноудалено</button>
        </template>
        <template v-else>
          <strong>{{ mainTotals.red }} : {{ mainTotals.blue }}</strong>
          <span>Общий счет</span>
          <button type="button" :disabled="!canPauseTimers" @click="store.pauseTimers">Остановить часы</button>
          <button type="button" class="danger-action" :disabled="!canCompleteEnd" @click="completeEnd">Перейти к сбору мячей</button>
        </template>
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

    <footer class="hotkey-strip">Z - часы красных · M - часы синих · Пробел - остановить часы · счет меняется без подтверждения</footer>
  </section>

  <section v-else class="page narrow-page">
    <h1>Матч не создан</h1>
    <RouterLink class="primary-action" to="/setup">Создать матч</RouterLink>
  </section>
</template>
