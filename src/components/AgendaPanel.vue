<script setup lang="ts">
import { computed } from 'vue'

import { formatTime, useClock } from '@/composables/useClock'
import { homeCity } from '@/config/cities'
import { useCalendarStore } from '@/stores/calendar'

const { now } = useClock()
const store = useCalendarStore()

const entry = computed(() => store.getEntry())
const stale = computed(() => store.isStale())

const isInitialLoading = computed(() => entry.value.status === 'loading' && !entry.value.data)
const isNotConnected = computed(() => entry.value.notConnected && !entry.value.data)
const isInitialError = computed(
  () => entry.value.status === 'error' && !entry.value.data && !entry.value.notConnected,
)
const isEmpty = computed(() => entry.value.data !== null && entry.value.data.length === 0)

const updatedLabel = computed(() => {
  const lastUpdatedAt = entry.value.lastUpdatedAt
  if (!lastUpdatedAt) return null
  const minutes = Math.max(0, Math.round((now.value.getTime() - lastUpdatedAt.getTime()) / 60000))
  if (minutes < 1) return 'Updated just now'
  if (minutes === 1) return 'Updated 1m ago'
  return `Updated ${minutes}m ago`
})

function timeRangeLabel(event: { start: Date; end: Date; allDay: boolean }): string {
  if (event.allDay) return 'All day'
  return `${formatTime(event.start, homeCity.timeZone)}–${formatTime(event.end, homeCity.timeZone)}`
}

function isPast(event: { end: Date; allDay: boolean }): boolean {
  if (event.allDay) return false
  return event.end.getTime() <= now.value.getTime()
}
</script>

<template>
  <section class="agenda-panel">
    <header class="agenda-panel__header">
      <h2 class="agenda-panel__title">Today</h2>
      <p v-if="stale" class="agenda-panel__badge agenda-panel__badge--stale">
        {{ updatedLabel }} · offline
      </p>
    </header>

    <div class="agenda-panel__body">
      <div v-if="isInitialLoading" class="agenda-panel__skeleton" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <p v-else-if="isNotConnected" class="agenda-panel__message">Calendar not connected yet</p>

      <p v-else-if="isInitialError" class="agenda-panel__message agenda-panel__message--error">
        Agenda unavailable · retrying
      </p>

      <p v-else-if="isEmpty" class="agenda-panel__message">No events today</p>

      <ul v-else-if="entry.data" class="agenda-panel__list">
        <li
          v-for="event in entry.data"
          :key="event.id"
          class="agenda-panel__event"
          :class="{ 'agenda-panel__event--past': isPast(event) }"
        >
          <span class="agenda-panel__time">{{ timeRangeLabel(event) }}</span>
          <span class="agenda-panel__event-title">{{ event.title }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.agenda-panel {
  display: flex;
  flex-direction: column;
  gap: clamp(0.6rem, 1.2vw, 1rem);
  padding: clamp(1.1rem, 2vw, 1.75rem);
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  color: var(--color-text-primary);
  min-height: 0;
  overflow: hidden;
}

.agenda-panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
}

.agenda-panel__title {
  margin: 0;
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.agenda-panel__badge {
  margin: 0;
  font-size: clamp(0.65rem, 0.85vw, 0.75rem);
  color: var(--color-text-tertiary);
}

.agenda-panel__badge--stale {
  color: var(--color-warning);
}

.agenda-panel__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.agenda-panel__message {
  margin: 0;
  font-size: clamp(0.85rem, 1.2vw, 1rem);
  color: var(--color-text-secondary);
}

.agenda-panel__message--error {
  color: var(--color-warning);
}

.agenda-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 1vw, 0.8rem);
  height: 100%;
  overflow: hidden;
}

.agenda-panel__event {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.agenda-panel__event--past {
  opacity: 0.45;
}

.agenda-panel__time {
  flex-shrink: 0;
  font-size: clamp(0.75rem, 1vw, 0.85rem);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.agenda-panel__event-title {
  font-size: clamp(0.85rem, 1.2vw, 1rem);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-panel__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.agenda-panel__skeleton span {
  display: block;
  height: 0.9rem;
  border-radius: 999px;
  background: var(--color-glass-border);
  animation: pulse 1.6s ease-in-out infinite;
}

.agenda-panel__skeleton span:nth-child(1) {
  width: 70%;
}

.agenda-panel__skeleton span:nth-child(2) {
  width: 55%;
}

.agenda-panel__skeleton span:nth-child(3) {
  width: 62%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
