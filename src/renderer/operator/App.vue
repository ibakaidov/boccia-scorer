<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
import { useScorerStore } from "./stores/scorerStore"

const store = useScorerStore()
</script>

<template>
  <div class="app-shell">
    <aside class="side-nav">
      <div class="brand">
        <span class="brand-mark">BC</span>
        <div>
          <strong>Boccia Scorer</strong>
          <small>версия 2 · автономный режим</small>
        </div>
      </div>

      <nav>
        <RouterLink to="/">Главная</RouterLink>
        <RouterLink to="/setup">Новый матч</RouterLink>
        <RouterLink to="/match">Матч</RouterLink>
        <RouterLink to="/protocol">Протокол</RouterLink>
        <RouterLink to="/history">История</RouterLink>
        <RouterLink to="/settings">Настройки</RouterLink>
      </nav>

      <div class="status-card">
        <span :class="['status-dot', store.status.serverOnline ? 'online' : 'offline']"></span>
        <span>{{ store.status.serverOnline ? "Сервер подключен" : "Автономный режим" }}</span>
        <small>{{ store.syncLabel }}</small>
      </div>
    </aside>

    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>
