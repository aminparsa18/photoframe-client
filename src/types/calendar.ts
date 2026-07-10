export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
}

export type CalendarStatus = 'idle' | 'loading' | 'success' | 'error'

export interface CalendarEntry {
  status: CalendarStatus
  data: CalendarEvent[] | null
  error: string | null
  lastUpdatedAt: Date | null
  notConnected: boolean
}
