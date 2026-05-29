<script setup lang="ts">
import type { SideColor } from "@shared/domain"

const props = defineProps<{
  color: SideColor
  label: string
  score: number
  total: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [delta: number]
}>()

function emitChange(delta: number) {
  if (props.disabled) return
  emit("change", delta)
}
</script>

<template>
  <section :class="['score-card', color]">
    <span>{{ label }}</span>
    <strong>{{ score }}</strong>
    <small>Итого: {{ total }}</small>
    <div class="button-row">
      <button class="score-button" type="button" :disabled="disabled" aria-label="Уменьшить счет" @click="emitChange(-1)">-</button>
      <button class="score-button" type="button" :disabled="disabled" aria-label="Увеличить счет" @click="emitChange(1)">+</button>
    </div>
  </section>
</template>
