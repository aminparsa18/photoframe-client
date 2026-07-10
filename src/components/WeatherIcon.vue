<script setup lang="ts">
import type { WeatherIconKind } from '@/constants/weatherCodes'

defineProps<{
  kind: WeatherIconKind
}>()

const CLOUD_PATH = 'M14 33h20a7 7 0 0 0 0-14 9 9 0 0 0-17.2-2.6A7.5 7.5 0 0 0 14 33Z'
</script>

<template>
  <svg
    class="weather-icon"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'clear-day'">
      <circle cx="24" cy="24" r="8.5" :stroke-width="1.7" />
      <g stroke-width="1.7">
        <line x1="24" y1="4" x2="24" y2="9" />
        <line x1="24" y1="39" x2="24" y2="44" />
        <line x1="4" y1="24" x2="9" y2="24" />
        <line x1="39" y1="24" x2="44" y2="24" />
        <line x1="10.3" y1="10.3" x2="13.8" y2="13.8" />
        <line x1="34.2" y1="34.2" x2="37.7" y2="37.7" />
        <line x1="37.7" y1="10.3" x2="34.2" y2="13.8" />
        <line x1="13.8" y1="34.2" x2="10.3" y2="37.7" />
      </g>
    </template>

    <template v-else-if="kind === 'clear-night'">
      <path d="M31 8a15 15 0 1 0 9 21.4A12 12 0 0 1 31 8Z" />
      <g fill="currentColor" stroke="none">
        <circle cx="38" cy="10" r="1.2" />
        <circle cx="42" cy="17" r="0.9" />
      </g>
    </template>

    <template v-else-if="kind === 'partly-cloudy-day'">
      <g stroke-width="1.6">
        <circle cx="18" cy="15" r="6.2" />
        <line x1="18" y1="2.5" x2="18" y2="5.5" />
        <line x1="6.5" y1="15" x2="9.5" y2="15" />
        <line x1="9.8" y1="6.8" x2="12" y2="9" />
        <line x1="24.2" y1="6.8" x2="22" y2="9" />
      </g>
      <path :d="CLOUD_PATH" transform="translate(2 4)" />
    </template>

    <template v-else-if="kind === 'partly-cloudy-night'">
      <path d="M17 5a10 10 0 1 0 6 14.2A8 8 0 0 1 17 5Z" transform="translate(1 -1)" />
      <path :d="CLOUD_PATH" transform="translate(2 4)" />
    </template>

    <template v-else-if="kind === 'cloudy'">
      <path :d="CLOUD_PATH" transform="translate(2 3)" />
      <path d="M10 20a5.5 5.5 0 0 1 1.4-10.8" transform="translate(-1 5)" />
    </template>

    <template v-else-if="kind === 'fog'">
      <path :d="CLOUD_PATH" transform="translate(2 -2)" />
      <g stroke-width="1.7">
        <line x1="9" y1="35" x2="39" y2="35" />
        <line x1="12" y1="40" x2="36" y2="40" />
        <line x1="6" y1="30" x2="42" y2="30" />
      </g>
    </template>

    <template v-else-if="kind === 'drizzle'">
      <path :d="CLOUD_PATH" transform="translate(2 -4)" />
      <g stroke-width="1.9">
        <line x1="18" y1="34" x2="16" y2="39" />
        <line x1="25" y1="34" x2="23" y2="39" />
        <line x1="32" y1="34" x2="30" y2="39" />
      </g>
    </template>

    <template v-else-if="kind === 'rain'">
      <path :d="CLOUD_PATH" transform="translate(2 -6)" />
      <g stroke-width="1.9">
        <line x1="16" y1="33" x2="13" y2="42" />
        <line x1="24" y1="33" x2="21" y2="42" />
        <line x1="32" y1="33" x2="29" y2="42" />
      </g>
    </template>

    <template v-else-if="kind === 'snow'">
      <path :d="CLOUD_PATH" transform="translate(2 -6)" />
      <g stroke-width="1.9" stroke-linecap="round">
        <path d="M16 35v7m-3.2-3.5 6.4 0m-5.4-2.2 4.4 4.4m0-4.4-4.4 4.4" />
        <path d="M32 35v7m-3.2-3.5 6.4 0m-5.4-2.2 4.4 4.4m0-4.4-4.4 4.4" />
      </g>
    </template>

    <template v-else-if="kind === 'thunderstorm'">
      <path :d="CLOUD_PATH" transform="translate(2 -8)" />
      <path d="M23 30 17 40h6l-2 8 9-11h-6l3-7Z" fill="currentColor" stroke="none" />
    </template>
  </svg>
</template>

<style scoped>
.weather-icon {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
