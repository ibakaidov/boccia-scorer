<script setup lang="ts">
import { onMounted } from "vue"
import { RouterLink, RouterView } from "vue-router"
import { useScorerStore } from "./stores/scorerStore"

const store = useScorerStore()

onMounted(() => {
  void store.bootstrap()
})
</script>

<template>
  <div class="app-shell">
    <aside class="side-nav">
      <div class="brand">
        <span class="brand-mark">BC</span>
        <div>
          <strong>Boccia Scorer</strong>
          <small>v2 offline-first</small>
        </div>
      </div>

      <nav>
        <RouterLink to="/">Старт</RouterLink>
        <RouterLink to="/setup">Новый матч</RouterLink>
        <RouterLink to="/match">Текущий энд</RouterLink>
        <RouterLink to="/protocol">Протокол</RouterLink>
        <RouterLink to="/history">История</RouterLink>
        <RouterLink to="/settings">Настройки</RouterLink>
      </nav>

      <div class="status-card">
        <span :class="['status-dot', store.status.serverOnline ? 'online' : 'offline']"></span>
        <span>{{ store.status.serverOnline ? "Сервер online" : "Автономно" }}</span>
        <small>{{ store.syncLabel }}</small>
      </div>
    </aside>

    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>
