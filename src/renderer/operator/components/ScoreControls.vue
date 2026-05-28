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
      <button type="button" :disabled="disabled" @click="emitChange(-1)">-</button>
      <button type="button" :disabled="disabled" @click="emitChange(1)">+</button>
    </div>
  </section>
</template>
