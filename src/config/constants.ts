export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export const WEATHER_REFRESH_INTERVAL_MS = 12 * 60 * 1000

export const WEATHER_RETRY_BACKOFF_MS = [30_000, 60_000, 120_000]

export const CALENDAR_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export const CALENDAR_RETRY_BACKOFF_MS = [30_000, 60_000, 120_000]

export const CALENDAR_MAX_RECUR_ITERATIONS = 5000

export const WAKE_WORD_PHRASE = 'hey nick'

export const WAKE_WORD_RESTART_DELAY_MS = 300

export const ASSISTANT_AUTO_DISMISS_MS = 20_000

export const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'

export const OPENAI_MODEL = 'gpt-4o-mini'

export const ASSISTANT_SYSTEM_PROMPT =
  'You are Nick, a concise voice assistant embedded in a photoframe on a wall. Keep replies short (1-3 sentences) and conversational, suitable for being read aloud.'

export const ASSISTANT_HISTORY_LIMIT = 8

export const SLIDESHOW_INTERVAL_MS = 10_000

export const SLIDESHOW_DELETE_CONFIRM_MS = 3_000

export const SWIPE_THRESHOLD_PX = 60
