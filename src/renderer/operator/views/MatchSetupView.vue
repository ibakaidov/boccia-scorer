<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { formatMatchResult, formatTimer } from "@shared/domain"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const router = useRouter()
const selectedClassId = ref("")
const selectedCourtId = ref("")
const error = ref("")

const classes = computed(() => store.settings.gameClasses.filter((item) => item.active).sort((a, b) => a.sortOrder - b.sortOrder))
const courts = computed(() => store.settings.courts.filter((item) => item.active).sort((a, b) => a.sortOrder - b.sortOrder))
const currentMatchLabel = computed(() => {
  if (!store.match) return ""
  const gameClass = store.settings.gameClasses.find((item) => item.id === store.match?.gameClassId)
  return `${gameClass?.code ?? "Матч"} · ${formatMatchResult(store.match)}`
})
const currentMatchRoute = computed(() => {
  if (!store.match) return "/setup"
  if (store.match.phase === "setup" || store.match.phase === "warmup") return "/warmup"
  if (store.match.phase === "protocol" || store.match.phase === "completed") return "/protocol"
  return "/match"
})
const currentMatchStatus = computed(() => {
  if (!store.match) return ""
  return store.match.status === "completed" || store.match.phase === "completed" ? "Матч завершен" : "Есть текущий незавершенный матч"
})

async function start() {
  error.value = ""
  if (!selectedClassId.value) {
    error.value = "Выберите класс матча"
    return
  }
  const replaceExisting = Boolean(store.match)
  if (replaceExisting && !confirm("Создать новый матч? Текущий матч будет заменен в окне оператора и на табло.")) return

  await store.startStandaloneMatch(selectedClassId.value, selectedCourtId.value || undefined, { replaceExisting })
  await store.startWarmup()
  await router.push("/warmup")
}
</script>

<template>
  <section class="page narrow-page">
    <p class="eyebrow">Автономный старт</p>
    <h1>Новый матч</h1>
    <p class="lead">Обязателен только класс. Стороны создаются автоматически: Красные и Синие.</p>

    <section v-if="store.match" class="warning-panel">
      <strong>{{ currentMatchStatus }}</strong>
      <span>{{ currentMatchLabel }} сейчас остается на табло.</span>
      <RouterLink class="secondary-action" :to="currentMatchRoute">Вернуться к текущему матчу</RouterLink>
    </section>

    <form class="panel-form" @submit.prevent="start">
      <label>
        Класс матча
        <select v-model="selectedClassId" required>
          <option value="">Выберите класс</option>
          <option v-for="gameClass in classes" :key="gameClass.id" :value="gameClass.id">
            {{ gameClass.code }} - {{ gameClass.nameRu }} / {{ formatTimer(gameClass.endTimeSec) }}
          </option>
        </select>
      </label>

      <label>
        Корт, необязательно
        <select v-model="selectedCourtId">
          <option value="">Без корта</option>
          <option v-for="court in courts" :key="court.id" :value="court.id">
            {{ court.name }}
          </option>
        </select>
      </label>

      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="primary-action" type="submit">Создать матч и перейти к разминке</button>
    </form>
  </section>
</template>
