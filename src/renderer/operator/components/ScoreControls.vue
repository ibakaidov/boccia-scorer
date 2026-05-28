<script setup lang="ts">
import type { SideColor } from "@shared/domain"

defineProps<{
  color: SideColor
  label: string
  score: number
  total: number
}>()

defineEmits<{
  change: [delta: number]
}>()
</script>

<template>
  <section :class="['score-card', color]">
    <span>{{ label }}</span>
    <strong>{{ score }}</strong>
    <small>Итого: {{ total }}</small>
    <div class="button-row">
      <button type="button" @click="$emit('change', -1)">-</button>
      <button type="button" @click="$emit('change', 1)">+</button>
    </div>
  </section>
</template>
