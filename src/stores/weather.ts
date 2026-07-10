import { reactive } from 'vue'
import { defineStore } from 'pinia'

import { homeCity } from '@/config/cities'
import { WEATHER_RETRY_BACKOFF_MS } from '@/config/constants'
import { fetchCurrentWeather } from '@/services/openMeteo'
import type { CityConfig, WeatherEntry } from '@/types/weather'

const WEATHER_CITIES: CityConfig[] = [homeCity]

function createIdleEntry(): WeatherEntry {
  return { status: 'idle', data: null, error: null, lastUpdatedAt: null }
}

export const useWeatherStore = defineStore('weather', () => {
  const entries = reactive<Record<string, WeatherEntry>>(
    Object.fromEntries(WEATHER_CITIES.map((city) => [city.id, createIdleEntry()])),
  )

  const abortControllers = new Map<string, AbortController>()
  const retryTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
  const retryAttempts = new Map<string, number>()

  function getEntry(cityId: string): WeatherEntry {
    return entries[cityId] ?? createIdleEntry()
  }

  function clearRetry(cityId: string) {
    const timeout = retryTimeouts.get(cityId)
    if (timeout !== undefined) {
      clearTimeout(timeout)
      retryTimeouts.delete(cityId)
    }
  }

  function scheduleRetry(city: CityConfig) {
    const attempt = retryAttempts.get(city.id) ?? 0
    if (attempt >= WEATHER_RETRY_BACKOFF_MS.length) return

    retryAttempts.set(city.id, attempt + 1)
    const delay = WEATHER_RETRY_BACKOFF_MS[attempt]
    const timeout = setTimeout(() => {
      fetchCity(city)
    }, delay)
    retryTimeouts.set(city.id, timeout)
  }

  async function fetchCity(city: CityConfig) {
    abortControllers.get(city.id)?.abort()
    const controller = new AbortController()
    abortControllers.set(city.id, controller)
    clearRetry(city.id)

    const entry = getEntry(city.id)
    if (entry.data === null) {
      entry.status = 'loading'
    }

    try {
      const data = await fetchCurrentWeather(city, controller.signal)
      entry.data = data
      entry.status = 'success'
      entry.error = null
      entry.lastUpdatedAt = new Date()
      retryAttempts.set(city.id, 0)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return

      entry.error = error instanceof Error ? error.message : 'Unknown error'
      entry.status = entry.data ? 'success' : 'error'
      if (entry.data === null) {
        scheduleRetry(city)
      }
    }
  }

  async function fetchAll() {
    await Promise.allSettled(WEATHER_CITIES.map((city) => fetchCity(city)))
  }

  function isStale(cityId: string) {
    const entry = getEntry(cityId)
    return entry.error !== null && entry.data !== null
  }

  return { entries, fetchCity, fetchAll, isStale, getEntry }
})
