<script setup lang="ts">
import { computed } from 'vue'

import WeatherIcon from '@/components/WeatherIcon.vue'
import { formatDate, formatTime, useClock } from '@/composables/useClock'
import { getWeatherPresentation } from '@/constants/weatherCodes'
import { useWeatherStore } from '@/stores/weather'
import type { CityConfig } from '@/types/weather'

const props = defineProps<{
  city: CityConfig
}>()

const { now } = useClock()
const store = useWeatherStore()

const entry = computed(() => store.getEntry(props.city.id))
const stale = computed(() => store.isStale(props.city.id))

const timeLabel = computed(() => formatTime(now.value, props.city.timeZone))
const dateLabel = computed(() => formatDate(now.value, props.city.timeZone))

const presentation = computed(() => {
  const data = entry.value.data
  if (!data) return null
  return getWeatherPresentation(data.weatherCode, data.isDay)
})

const updatedLabel = computed(() => {
  const lastUpdatedAt = entry.value.lastUpdatedAt
  if (!lastUpdatedAt) return null
  const minutes = Math.max(0, Math.round((now.value.getTime() - lastUpdatedAt.getTime()) / 60000))
  if (minutes < 1) return 'Updated just now'
  if (minutes === 1) return 'Updated 1m ago'
  return `Updated ${minutes}m ago`
})

const isInitialLoading = computed(() => entry.value.status === 'loading' && !entry.value.data)
const isInitialError = computed(() => entry.value.status === 'error' && !entry.value.data)

const isNight = computed(() => entry.value.data?.isDay === false)
</script>

<template>
  <article class="city-card" :class="{ 'city-card--night': isNight }">
    <div v-if="presentation" class="city-card__watermark" aria-hidden="true">
      <WeatherIcon :kind="presentation.icon" />
    </div>

    <div class="city-card__content">
      <header class="city-card__header">
        <h2 class="city-card__name">{{ city.name }}</h2>
        <p class="city-card__country">{{ city.country }}</p>
      </header>

      <div class="city-card__clock">
        <p class="city-card__time">{{ timeLabel }}</p>
        <p class="city-card__date">{{ dateLabel }}</p>
      </div>

      <div class="city-card__weather">
        <template v-if="entry.data && presentation">
          <div class="city-card__weather-main">
            <div class="city-card__icon">
              <WeatherIcon :kind="presentation.icon" />
            </div>
            <div class="city-card__temp-block">
              <p class="city-card__temp">{{ Math.round(entry.data.temperature) }}°</p>
              <p class="city-card__condition">{{ presentation.label }}</p>
            </div>
          </div>
          <dl class="city-card__details">
            <div class="city-card__detail">
              <dt>Feels like</dt>
              <dd>{{ Math.round(entry.data.apparentTemperature) }}°</dd>
            </div>
            <div class="city-card__detail">
              <dt>Humidity</dt>
              <dd>{{ Math.round(entry.data.humidity) }}%</dd>
            </div>
            <div class="city-card__detail">
              <dt>Wind</dt>
              <dd>{{ Math.round(entry.data.windSpeed) }} km/h</dd>
            </div>
          </dl>
          <p v-if="stale" class="city-card__badge city-card__badge--stale">
            {{ updatedLabel }} · offline
          </p>
          <p v-else-if="updatedLabel" class="city-card__badge">{{ updatedLabel }}</p>
        </template>

        <template v-else-if="isInitialLoading">
          <div class="city-card__skeleton" aria-hidden="true">
            <div class="city-card__skeleton-icon"></div>
            <div class="city-card__skeleton-lines">
              <span></span>
              <span></span>
            </div>
          </div>
        </template>

        <template v-else-if="isInitialError">
          <p class="city-card__badge city-card__badge--error">Weather unavailable · retrying</p>
        </template>
      </div>
    </div>
  </article>
</template>

<style scoped>
.city-card {
  position: relative;
  overflow: hidden;
  padding: clamp(1.25rem, 2.4vw, 2.25rem);
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  color: var(--color-text-primary);
  min-height: 0;
  --card-accent: var(--color-accent-day);
}

.city-card--night {
  --card-accent: var(--color-accent-night);
}

.city-card__watermark {
  position: absolute;
  z-index: 0;
  top: 46%;
  right: -12%;
  width: 62%;
  aspect-ratio: 1;
  color: var(--card-accent);
  opacity: 0.14;
  transform: rotate(-6deg);
  pointer-events: none;
}

.city-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.6vw, 1.5rem);
  height: 100%;
}

.city-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.city-card__name {
  margin: 0;
  font-size: clamp(1.15rem, 2.1vw, 1.6rem);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.city-card__country {
  margin: 0;
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.city-card__clock {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
}

.city-card__time {
  margin: 0;
  font-size: clamp(2.4rem, 6.4vw, 4.2rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.city-card__date {
  margin: 0;
  font-size: clamp(0.85rem, 1.2vw, 1.05rem);
  color: var(--color-text-secondary);
}

.city-card__weather {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.city-card__weather-main {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.4vw, 1rem);
}

.city-card__icon {
  width: clamp(2.75rem, 5.2vw, 4rem);
  height: clamp(2.75rem, 5.2vw, 4rem);
  color: var(--card-accent);
  flex-shrink: 0;
}

.city-card__temp-block {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
}

.city-card__temp {
  margin: 0;
  font-size: clamp(1.9rem, 3.6vw, 2.75rem);
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.city-card__condition {
  margin: 0;
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  color: var(--color-text-secondary);
}

.city-card__details {
  display: flex;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  margin: 0;
}

.city-card__detail {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
}

.city-card__detail dt {
  font-size: clamp(0.65rem, 0.85vw, 0.75rem);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.city-card__detail dd {
  margin: 0;
  font-size: clamp(0.85rem, 1.2vw, 1.05rem);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.city-card__badge {
  margin: 0;
  font-size: clamp(0.7rem, 0.9vw, 0.8rem);
  color: var(--color-text-tertiary);
}

.city-card__badge--stale {
  color: var(--color-warning);
}

.city-card__badge--error {
  color: var(--color-warning);
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
}

.city-card__skeleton {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.4vw, 1rem);
}

.city-card__skeleton-icon {
  width: clamp(2.75rem, 5.2vw, 4rem);
  height: clamp(2.75rem, 5.2vw, 4rem);
  border-radius: 50%;
  background: var(--color-glass-border);
  animation: pulse 1.6s ease-in-out infinite;
}

.city-card__skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.city-card__skeleton-lines span {
  display: block;
  height: 0.9rem;
  border-radius: 999px;
  background: var(--color-glass-border);
  animation: pulse 1.6s ease-in-out infinite;
}

.city-card__skeleton-lines span:first-child {
  width: 45%;
}

.city-card__skeleton-lines span:last-child {
  width: 65%;
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
