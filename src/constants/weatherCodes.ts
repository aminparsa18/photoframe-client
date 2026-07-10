export type WeatherIconKind =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'

interface WeatherCodeGroup {
  label: string
  dayIcon: WeatherIconKind
  nightIcon: WeatherIconKind
}

const WEATHER_CODE_GROUPS: Record<number, WeatherCodeGroup> = {
  0: { label: 'Clear sky', dayIcon: 'clear-day', nightIcon: 'clear-night' },
  1: { label: 'Mainly clear', dayIcon: 'clear-day', nightIcon: 'clear-night' },
  2: { label: 'Partly cloudy', dayIcon: 'partly-cloudy-day', nightIcon: 'partly-cloudy-night' },
  3: { label: 'Overcast', dayIcon: 'cloudy', nightIcon: 'cloudy' },
  45: { label: 'Fog', dayIcon: 'fog', nightIcon: 'fog' },
  48: { label: 'Depositing rime fog', dayIcon: 'fog', nightIcon: 'fog' },
  51: { label: 'Light drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle' },
  53: { label: 'Moderate drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle' },
  55: { label: 'Dense drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle' },
  56: { label: 'Freezing drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle' },
  57: { label: 'Freezing drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle' },
  61: { label: 'Slight rain', dayIcon: 'rain', nightIcon: 'rain' },
  63: { label: 'Moderate rain', dayIcon: 'rain', nightIcon: 'rain' },
  65: { label: 'Heavy rain', dayIcon: 'rain', nightIcon: 'rain' },
  66: { label: 'Freezing rain', dayIcon: 'rain', nightIcon: 'rain' },
  67: { label: 'Freezing rain', dayIcon: 'rain', nightIcon: 'rain' },
  71: { label: 'Slight snow', dayIcon: 'snow', nightIcon: 'snow' },
  73: { label: 'Moderate snow', dayIcon: 'snow', nightIcon: 'snow' },
  75: { label: 'Heavy snow', dayIcon: 'snow', nightIcon: 'snow' },
  77: { label: 'Snow grains', dayIcon: 'snow', nightIcon: 'snow' },
  80: { label: 'Rain showers', dayIcon: 'rain', nightIcon: 'rain' },
  81: { label: 'Rain showers', dayIcon: 'rain', nightIcon: 'rain' },
  82: { label: 'Violent rain showers', dayIcon: 'rain', nightIcon: 'rain' },
  85: { label: 'Snow showers', dayIcon: 'snow', nightIcon: 'snow' },
  86: { label: 'Snow showers', dayIcon: 'snow', nightIcon: 'snow' },
  95: { label: 'Thunderstorm', dayIcon: 'thunderstorm', nightIcon: 'thunderstorm' },
  96: { label: 'Thunderstorm with hail', dayIcon: 'thunderstorm', nightIcon: 'thunderstorm' },
  99: { label: 'Thunderstorm with hail', dayIcon: 'thunderstorm', nightIcon: 'thunderstorm' },
}

const DEFAULT_GROUP: WeatherCodeGroup = {
  label: 'Unknown',
  dayIcon: 'cloudy',
  nightIcon: 'cloudy',
}

export function getWeatherPresentation(code: number, isDay: boolean) {
  const group = WEATHER_CODE_GROUPS[code] ?? DEFAULT_GROUP
  return {
    label: group.label,
    icon: isDay ? group.dayIcon : group.nightIcon,
  }
}
