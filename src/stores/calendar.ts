import { reactive } from 'vue'
import { defineStore } from 'pinia'

import { homeCity } from '@/config/cities'
import { CALENDAR_RETRY_BACKOFF_MS } from '@/config/constants'
import { CalendarNotConnectedError, fetchCalendarIcs, parseTodayEvents } from '@/services/calendar'
import type { CalendarEntry } from '@/types/calendar'

function createIdleEntry(): CalendarEntry {
  return { status: 'idle', data: null, error: null, lastUpdatedAt: null, notConnected: false }
}

export const useCalendarStore = defineStore('calendar', () => {
  const entry = reactive<CalendarEntry>(createIdleEntry())

  let abortController: AbortController | undefined
  let retryTimeout: ReturnType<typeof setTimeout> | undefined
  let retryAttempt = 0

  function clearRetry() {
    if (retryTimeout !== undefined) {
      clearTimeout(retryTimeout)
      retryTimeout = undefined
    }
  }

  function scheduleRetry() {
    if (retryAttempt >= CALENDAR_RETRY_BACKOFF_MS.length) return
    const delay = CALENDAR_RETRY_BACKOFF_MS[retryAttempt]
    retryAttempt += 1
    retryTimeout = setTimeout(() => {
      refresh()
    }, delay)
  }

  async function refresh() {
    abortController?.abort()
    abortController = new AbortController()
    clearRetry()

    if (entry.data === null) {
      entry.status = 'loading'
    }

    try {
      const icsText = await fetchCalendarIcs(abortController.signal)
      entry.data = parseTodayEvents(icsText, homeCity.timeZone, new Date())
      entry.status = 'success'
      entry.error = null
      entry.notConnected = false
      entry.lastUpdatedAt = new Date()
      retryAttempt = 0
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return

      entry.notConnected = error instanceof CalendarNotConnectedError
      entry.error = error instanceof Error ? error.message : 'Unknown error'
      entry.status = entry.data ? 'success' : 'error'
      if (entry.data === null && !entry.notConnected) {
        scheduleRetry()
      }
    }
  }

  function isStale() {
    return entry.error !== null && entry.data !== null
  }

  function getEntry(): CalendarEntry {
    return entry
  }

  return { entry, refresh, isStale, getEntry }
})
