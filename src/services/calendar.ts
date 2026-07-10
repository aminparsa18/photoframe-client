import ICAL from 'ical.js'

import { CALENDAR_MAX_RECUR_ITERATIONS } from '@/config/constants'
import type { CalendarEvent } from '@/types/calendar'

export class CalendarNotConnectedError extends Error {
  constructor() {
    super('Calendar feed not configured')
    this.name = 'CalendarNotConnectedError'
  }
}

export async function fetchCalendarIcs(signal?: AbortSignal): Promise<string> {
  const response = await fetch('/calendar.ics', { signal, cache: 'no-store' })

  if (response.status === 404) {
    throw new CalendarNotConnectedError()
  }
  if (!response.ok) {
    throw new Error(`Calendar request failed with status ${response.status}`)
  }

  return response.text()
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function getUtcOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return asUtc - date.getTime()
}

function resolveLocalMidnight(naiveMidnightUtcMs: number, timeZone: string): number {
  let offsetMs = getUtcOffsetMs(new Date(naiveMidnightUtcMs), timeZone)
  let instant = naiveMidnightUtcMs - offsetMs
  offsetMs = getUtcOffsetMs(new Date(instant), timeZone)
  instant = naiveMidnightUtcMs - offsetMs
  return instant
}

interface DayBounds {
  dayStart: Date
  dayEnd: Date
  localYmd: string
}

function getDayBoundsInTimeZone(now: Date, timeZone: string): DayBounds {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  )
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)

  const dayStartMs = resolveLocalMidnight(Date.UTC(year, month - 1, day, 0, 0, 0), timeZone)
  const dayEndMs = resolveLocalMidnight(Date.UTC(year, month - 1, day + 1, 0, 0, 0), timeZone)

  return {
    dayStart: new Date(dayStartMs),
    dayEnd: new Date(dayEndMs),
    localYmd: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

function icalTimeToYmd(time: ICAL.Time): string {
  return `${time.year}-${pad(time.month)}-${pad(time.day)}`
}

function allDayOverlapsToday(start: ICAL.Time, end: ICAL.Time, localYmd: string): boolean {
  const startYmd = icalTimeToYmd(start)
  const endYmd = icalTimeToYmd(end)
  return startYmd <= localYmd && localYmd < endYmd
}

function timedOverlapsToday(start: ICAL.Time, end: ICAL.Time, bounds: DayBounds): boolean {
  return start.toJSDate() < bounds.dayEnd && end.toJSDate() > bounds.dayStart
}

export function parseTodayEvents(icsText: string, timeZone: string, now: Date): CalendarEvent[] {
  const bounds = getDayBoundsInTimeZone(now, timeZone)
  const vcalendar = new ICAL.Component(ICAL.parse(icsText))

  for (const vtimezone of vcalendar.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(vtimezone)
  }

  const events: CalendarEvent[] = []

  for (const vevent of vcalendar.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(vevent)

    if (!event.isRecurring()) {
      const overlaps = event.startDate.isDate
        ? allDayOverlapsToday(event.startDate, event.endDate, bounds.localYmd)
        : timedOverlapsToday(event.startDate, event.endDate, bounds)

      if (overlaps) {
        events.push({
          id: event.uid,
          title: event.summary,
          start: event.startDate.toJSDate(),
          end: event.endDate.toJSDate(),
          allDay: event.startDate.isDate,
        })
      }
      continue
    }

    const iterator = event.iterator()
    let iterations = 0
    let next = iterator.next()

    while (next) {
      iterations += 1
      if (iterations > CALENDAR_MAX_RECUR_ITERATIONS) {
        console.warn(
          `Stopped expanding recurring event "${event.summary}" after hitting the iteration cap`,
        )
        break
      }

      const occurrence = event.getOccurrenceDetails(next)
      const { startDate, endDate } = occurrence

      if (startDate.toJSDate() >= bounds.dayEnd) break

      const overlaps = startDate.isDate
        ? allDayOverlapsToday(startDate, endDate, bounds.localYmd)
        : timedOverlapsToday(startDate, endDate, bounds)

      if (overlaps) {
        events.push({
          id: `${event.uid}-${occurrence.recurrenceId.toString()}`,
          title: occurrence.item.summary,
          start: startDate.toJSDate(),
          end: endDate.toJSDate(),
          allDay: startDate.isDate,
        })
      }

      next = iterator.next()
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime())
  return events
}
