import { OPEN_METEO_BASE_URL } from '@/config/constants'
import type { CityConfig, CurrentWeather } from '@/types/weather'

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
}

export async function fetchCurrentWeather(
  city: CityConfig,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const url = new URL(OPEN_METEO_BASE_URL)
  url.searchParams.set('latitude', String(city.latitude))
  url.searchParams.set('longitude', String(city.longitude))
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
  )
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as OpenMeteoResponse

  return {
    temperature: payload.current.temperature_2m,
    apparentTemperature: payload.current.apparent_temperature,
    humidity: payload.current.relative_humidity_2m,
    windSpeed: payload.current.wind_speed_10m,
    weatherCode: payload.current.weather_code,
    isDay: payload.current.is_day === 1,
  }
}
