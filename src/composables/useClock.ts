import { onMounted, onUnmounted, readonly, ref } from 'vue'

const now = ref(new Date())
let subscribers = 0
let intervalId: ReturnType<typeof setInterval> | undefined

export function useClock() {
  onMounted(() => {
    subscribers += 1
    if (subscribers === 1) {
      intervalId = setInterval(() => {
        now.value = new Date()
      }, 1000)
    }
  })

  onUnmounted(() => {
    subscribers -= 1
    if (subscribers === 0 && intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
  })

  return { now: readonly(now) }
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>()
const dateFormatters = new Map<string, Intl.DateTimeFormat>()

export function formatTime(date: Date, timeZone: string): string {
  let formatter = timeFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    timeFormatters.set(timeZone, formatter)
  }
  return formatter.format(date)
}

export function formatDate(date: Date, timeZone: string): string {
  let formatter = dateFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    dateFormatters.set(timeZone, formatter)
  }
  return formatter.format(date)
}
