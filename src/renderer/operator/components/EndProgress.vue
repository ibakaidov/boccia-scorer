<script setup lang="ts">
import type { End } from "@shared/domain"

defineProps<{
  ends: End[]
  activeIndex: number
}>()
</script>

<template>
  <div class="end-progress" :aria-label="`Энд ${activeIndex + 1} из ${ends.length}`">
    <span
      v-for="(end, index) in ends"
      :key="end.index"
      :class="[
        'end-dot',
        {
          completed: end.status === 'completed',
          active: index === activeIndex,
          pending: end.status === 'notStarted'
        }
      ]"
    ></span>
    <span class="sr-only">Энд {{ activeIndex + 1 }} из {{ ends.length }}</span>
  </div>
</template>
