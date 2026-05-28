<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue"
import { useRouter } from "vue-router"
import { formatTimer } from "@shared/domain"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const router = useRouter()
let interval: number | undefined

onMounted(() => {
  interval = window.setInterval(() => void store.tick(), 1000)
})

onBeforeUnmount(() => {
  if (interval) window.clearInterval(interval)
})

async function startPause() {
  if (!store.timers) return
  store.timers.warmup.running = !store.timers.warmup.running
  store.timers.warmup.startedAt = store.timers.warmup.running ? new Date().toISOString() : undefined
  await store.refreshScoreboard()
}

async function toEnds() {
  await store.pauseTimers()
  await store.startEnds()
  await router.push("/match")
}
</script>

<template>
  <section class="page center-page">
    <p class="eyebrow">Разминка</p>
    <h1>{{ store.activeGameClass?.code ?? "Матч" }}</h1>
    <button class="giant-timer" type="button" @click="startPause">
      {{ store.timers ? formatTimer(store.timers.warmup.maxSec - store.timers.warmup.elapsedSec) : "02:00" }}
    </button>
    <div class="button-row center">
      <button type="button" class="secondary-action" @click="startPause">Старт / пауза</button>
      <button type="button" class="primary-action" @click="toEnds">Перейти к эндам</button>
    </div>
  </section>
</template>
