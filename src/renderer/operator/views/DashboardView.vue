<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useScorerStore } from "../stores/scorerStore"

const store = useScorerStore()
const activeClasses = computed(() => store.settings.gameClasses.filter((item) => item.active).length)
</script>

<template>
  <section class="page hero-page">
    <div>
      <p class="eyebrow">Окно оператора</p>
      <h1>Счетчик готов к автономному матчу</h1>
      <p class="lead">
        Для малого соревнования достаточно выбрать класс. Игроки, регион, команда, судьи и этап не
        блокируют старт.
      </p>
      <div class="button-row">
        <RouterLink class="primary-action" to="/setup">Начать матч</RouterLink>
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
