import type { CityConfig } from '@/types/weather'

export const cities: CityConfig[] = [
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    timeZone: 'Asia/Bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
  },
  {
    id: 'tehran',
    name: 'Tehran',
    country: 'Iran',
    timeZone: 'Asia/Tehran',
    latitude: 35.6892,
    longitude: 51.389,
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    timeZone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'USA',
    timeZone: 'America/New_York',
    latitude: 40.7128,
    longitude: -74.006,
  },
]

export const homeCityId = 'bangkok'

export const homeCity = cities.find((city) => city.id === homeCityId)!
