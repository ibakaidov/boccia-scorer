<script setup lang="ts">
import { reactive, watch } from "vue"
import { useScorerStore } from "../stores/scorerStore"
import type { AppSettings } from "@shared/domain"

const store = useScorerStore()
const draft = reactive<AppSettings>(structuredClone(store.settings))

watch(
  () => store.settings,
  (settings) => Object.assign(draft, structuredClone(settings)),
  { deep: true }
)

async function save() {
  await store.saveSettings(structuredClone(draft))
}

async function reset() {
  if (confirm("Сбросить настройки к дефолтам? Матчи, очередь и логи не удаляются.")) {
    await store.resetSettings()
  }
}
</script>

<template>
  <section class="page settings-page">
    <p class="eyebrow">Настройки</p>
    <h1>Классы, времена и сервер</h1>

    <div class="settings-grid">
      <section class="settings-panel">
        <h2>Сервер</h2>
        <label><input v-model="draft.server.enabled" type="checkbox" /> Включить server-mode</label>
        <label>URL <input v-model="draft.server.baseUrl" type="url" /></label>
      </section>

      <section class="settings-panel">
        <h2>Таймеры</h2>
        <label>Разминка, сек <input v-model.number="draft.timers.warmupSec" type="number" min="1" /></label>
        <label>Сбор мячей, сек <input v-model.number="draft.timers.collectBallsSec" type="number" min="1" /></label>
        <label>Штрафной мяч, сек <input v-model.number="draft.timers.penaltyBallSec" type="number" min="1" /></label>
        <label>Техтайм-аут, сек <input v-model.number="draft.timers.technicalTimeoutSec" type="number" min="1" /></label>
      </section>

      <section class="settings-panel">
        <h2>Большое табло</h2>
        <label>
          Цветовой фон
          <select v-model="draft.scoreboard.theme">
            <option value="dark">Темный фон, как сейчас</option>
            <option value="split">Половина красная, половина синяя</option>
          </select>
        </label>
      </section>
    </div>

    <section class="settings-panel">
      <h2>Классы</h2>
      <div class="class-editor" v-for="gameClass in draft.gameClasses" :key="gameClass.id">
        <label><input v-model="gameClass.active" type="checkbox" /> {{ gameClass.code }}</label>
        <input v-model="gameClass.nameRu" />
        <input v-model.number="gameClass.endsCount" type="number" min="1" />
        <input v-model.number="gameClass.endTimeSec" type="number" min="1" />
      </div>
    </section>

    <div class="button-row">
      <button class="primary-action" type="button" @click="save">Сохранить</button>
      <button class="secondary-action" type="button" @click="reset">Сбросить к дефолтам</button>
    </div>
  </section>
</template>
