<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { formatMatchResult } from "@shared/domain"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const activeClasses = computed(() => store.settings.gameClasses.filter((item) => item.active).length)
const hasMatch = computed(() => Boolean(store.match))
const currentMatchRoute = computed(() => {
  if (!store.match) return "/setup"
  if (store.match.phase === "setup" || store.match.phase === "warmup") return "/warmup"
  if (store.match.phase === "protocol" || store.match.phase === "completed") return "/protocol"
  return "/match"
})
const currentMatchLabel = computed(() => {
  if (!store.match) return "Матч не создан"
  const gameClass = store.settings.gameClasses.find((item) => item.id === store.match?.gameClassId)
  return `${gameClass?.code ?? "Матч"} · ${formatMatchResult(store.match)}`
})
const currentMatchStatus = computed(() => {
  if (!store.match) return "Счетчик готов к автономному матчу"
  return store.match.status === "completed" || store.match.phase === "completed" ? "На табло завершенный матч" : "Есть текущий матч"
})
</script>

<template>
  <section class="page hero-page">
    <div>
      <p class="eyebrow">Окно оператора</p>
      <h1>{{ currentMatchStatus }}</h1>
      <p v-if="hasMatch" class="lead">
        {{ currentMatchLabel }}. Чтобы начать другой матч, откройте форму нового матча и подтвердите замену.
      </p>
      <p v-else class="lead">
        Для малого соревнования достаточно выбрать класс. Игроки, регион, команда, судьи и этап не
        блокируют старт.
      </p>
      <div class="button-row">
        <RouterLink v-if="hasMatch" class="primary-action" :to="currentMatchRoute">Открыть текущий матч</RouterLink>
        <RouterLink :class="hasMatch ? 'secondary-action' : 'primary-action'" to="/setup">Новый матч</RouterLink>
        <RouterLink class="secondary-action" to="/settings">Проверить настройки</RouterLink>
      </div>
    </div>

    <div class="dashboard-grid">
      <article class="metric-card">
        <span>Сервер</span>
        <strong>{{ store.status.serverOnline ? "Online" : "Offline" }}</strong>
        <small>Offline является штатным режимом</small>
      </article>
      <article class="metric-card">
        <span>Активные классы</span>
        <strong>{{ activeClasses }}</strong>
        <small>Дефолты 2025-2028</small>
      </article>
      <article class="metric-card">
        <span>Очередь sync</span>
        <strong>{{ store.syncQueue.length }}</strong>
        <small>{{ store.syncLabel }}</small>
      </article>
      <article class="metric-card">
        <span>История</span>
        <strong>{{ store.history.length }}</strong>
        <small>Завершенные матчи SQLite</small>
      </article>
    </div>
  </section>
</template>
