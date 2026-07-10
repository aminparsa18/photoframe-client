import { onMounted, onUnmounted } from 'vue'

import { CALENDAR_REFRESH_INTERVAL_MS } from '@/config/constants'
import { useCalendarStore } from '@/stores/calendar'

export function useCalendarAutoRefresh() {
  const store = useCalendarStore()
  let intervalId: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    store.refresh()
    intervalId = setInterval(() => {
      store.refresh()
    }, CALENDAR_REFRESH_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId !== undefined) clearInterval(intervalId)
  })
}
