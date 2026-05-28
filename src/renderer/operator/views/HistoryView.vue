<script setup lang="ts">
import { onMounted } from "vue"
import { useScorerStore } from "../stores/scorerStore"
import { calculateMatchTotals } from "@shared/domain"

const store = useScorerStore()

onMounted(() => {
  void store.refreshHistory()
})
</script>

<template>
  <section class="page">
    <p class="eyebrow">SQLite</p>
    <h1>История завершенных матчей</h1>
    <table class="data-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Класс</th>
          <th>Счет</th>
          <th>Client ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="match in store.history" :key="match.clientId">
          <td>{{ match.completedAt }}</td>
          <td>{{ store.settings.gameClasses.find((item) => item.id === match.gameClassId)?.code }}</td>
          <td>{{ calculateMatchTotals(match).red }} : {{ calculateMatchTotals(match).blue }}</td>
          <td>{{ match.clientId }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
