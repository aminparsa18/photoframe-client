<script setup lang="ts">
import { computed } from 'vue'

import { formatDate, formatTime, useClock } from '@/composables/useClock'
import type { CityConfig } from '@/types/weather'

const props = defineProps<{
  city: CityConfig
}>()

const { now } = useClock()

const timeLabel = computed(() => formatTime(now.value, props.city.timeZone))
const dateLabel = computed(() => formatDate(now.value, props.city.timeZone))
</script>

<template>
  <div class="world-clock">
    <div class="world-clock__place">
      <p class="world-clock__name">{{ city.name }}</p>
      <p class="world-clock__country">{{ city.country }}</p>
    </div>
    <div class="world-clock__time-block">
      <p class="world-clock__time">{{ timeLabel }}</p>
      <p class="world-clock__date">{{ dateLabel }}</p>
    </div>
  </div>
</template>

<style scoped>
.world-clock {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(1rem, 1.8vw, 1.5rem) clamp(1.25rem, 2vw, 1.75rem);
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  color: var(--color-text-primary);
}

.world-clock__name {
  margin: 0;
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.world-clock__country {
  margin: 0.15em 0 0;
  font-size: clamp(0.7rem, 0.95vw, 0.8rem);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.world-clock__time-block {
  text-align: right;
}

.world-clock__time {
  margin: 0;
  font-size: clamp(1.5rem, 2.8vw, 2.1rem);
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.world-clock__date {
  margin: 0.2em 0 0;
  font-size: clamp(0.7rem, 0.95vw, 0.8rem);
  color: var(--color-text-secondary);
}
</style>
