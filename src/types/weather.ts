export interface CityConfig {
  id: string
  name: string
  country: string
  timeZone: string
  latitude: number
  longitude: number
}

export interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
}

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error'

export interface WeatherEntry {
  status: WeatherStatus
  data: CurrentWeather | null
  error: string | null
  lastUpdatedAt: Date | null
}
