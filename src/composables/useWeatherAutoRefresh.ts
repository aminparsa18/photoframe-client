import { onMounted, onUnmounted } from 'vue'

import { WEATHER_REFRESH_INTERVAL_MS } from '@/config/constants'
import { useWeatherStore } from '@/stores/weather'

export function useWeatherAutoRefresh() {
  const store = useWeatherStore()
  let intervalId: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    store.fetchAll()
    intervalId = setInterval(() => {
      store.fetchAll()
    }, WEATHER_REFRESH_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId !== undefined) clearInterval(intervalId)
  })
}
