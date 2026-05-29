<script setup lang="ts">
import { formatTimer } from "@shared/domain"
import type { TimerState } from "@shared/domain"

defineProps<{
  title: string
  timer: TimerState
  tone?: "red" | "blue" | "neutral"
  disabled?: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <section :class="['timer-card', tone ?? 'neutral', { running: timer.running }]">
    <header>
      <span>{{ title }}</span>
      <strong>{{ timer.running ? "Время идет" : "Остановлено" }}</strong>
    </header>
    <button class="timer-face" type="button" :disabled="disabled" @click="$emit('toggle')">
      {{ formatTimer(timer.maxSec - timer.elapsedSec) }}
    </button>
    <small>Использовано: {{ formatTimer(timer.elapsedSec) }}</small>
  </section>
</template>
