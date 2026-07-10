export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export const WEATHER_REFRESH_INTERVAL_MS = 12 * 60 * 1000

export const WEATHER_RETRY_BACKOFF_MS = [30_000, 60_000, 120_000]

export const CALENDAR_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export const CALENDAR_RETRY_BACKOFF_MS = [30_000, 60_000, 120_000]

export const CALENDAR_MAX_RECUR_ITERATIONS = 5000
