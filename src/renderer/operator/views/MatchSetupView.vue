<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { formatTimer } from "@shared/domain"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const router = useRouter()
const selectedClassId = ref("")
const selectedCourtId = ref("")
const error = ref("")

const classes = computed(() => store.settings.gameClasses.filter((item) => item.active).sort((a, b) => a.sortOrder - b.sortOrder))

async function start() {
  error.value = ""
  if (!selectedClassId.value) {
    error.value = "Выберите класс матча"
    return
  }
  await store.startStandaloneMatch(selectedClassId.value, selectedCourtId.value || undefined)
  await store.startWarmup()
  await router.push("/warmup")
}
</script>

<template>
  <section class="page narrow-page">
    <p class="eyebrow">Автономный старт</p>
    <h1>Новый матч</h1>
    <p class="lead">Обязателен только класс. Стороны создаются автоматически: Красные и Синие.</p>

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
          <option v-for="court in store.settings.courts" :key="court.id" :value="court.id">
            {{ court.name }}
          </option>
        </select>
      </label>

      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="primary-action" type="submit">Создать матч и перейти к разминке</button>
    </form>
  </section>
</template>
