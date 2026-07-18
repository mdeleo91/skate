import { useEffect, useState } from 'react'

// open-meteo.com — free, no API key required.
const API = 'https://api.open-meteo.com/v1/forecast'

export function scoreConditions(w) {
  if (!w) return null
  let score = 100
  const notes = []
  if (w.temp < 35) { score -= 35; notes.push('Cold enough that wheels lose grip and hands go numb.') }
  else if (w.temp < 48) { score -= 12; notes.push('Chilly — dress in layers you can shed.') }
  else if (w.temp > 92) { score -= 30; notes.push('Hot. Go early or late, and carry water.') }
  else if (w.temp > 82) { score -= 10; notes.push('Warm — bring more water than you think you need.') }
  else notes.push('Temperature is right in the sweet spot.')

  if (w.rain > 60) { score -= 50; notes.push('High chance of rain — wet pavement plus urethane is a bad combination.') }
  else if (w.rain > 25) { score -= 20; notes.push('Some rain risk — keep the loop short and close to home.') }

  if (w.wind > 22) { score -= 25; notes.push('Strong wind. Skate into it first, get pushed home.') }
  else if (w.wind > 13) { score -= 8; notes.push('Breezy — plan the outbound leg into the wind.') }

  if (w.uv >= 8) { score -= 8; notes.push('High UV — sunscreen, seriously.') }

  score = Math.max(0, Math.min(100, score))
  const verdict = score >= 80 ? 'Great day to skate' : score >= 60 ? 'Good day to skate' : score >= 40 ? 'Skateable, with caveats' : 'Maybe an indoor day'
  const icon = score >= 80 ? 'roller_skating' : score >= 60 ? 'thumb_up' : score >= 40 ? 'help' : 'home'
  return { score, verdict, icon, notes }
}

export const CODE = {
  0: ['Clear', 'sunny'], 1: ['Mostly clear', 'partly_cloudy_day'], 2: ['Partly cloudy', 'partly_cloudy_day'], 3: ['Overcast', 'cloud'],
  45: ['Fog', 'foggy'], 48: ['Rime fog', 'foggy'], 51: ['Light drizzle', 'rainy'], 53: ['Drizzle', 'rainy'],
  55: ['Heavy drizzle', 'rainy'], 61: ['Light rain', 'rainy'], 63: ['Rain', 'rainy'], 65: ['Heavy rain', 'thunderstorm'],
  71: ['Light snow', 'weather_snowy'], 73: ['Snow', 'weather_snowy'], 75: ['Heavy snow', 'ac_unit'], 80: ['Showers', 'rainy'],
  81: ['Showers', 'rainy'], 82: ['Heavy showers', 'thunderstorm'], 95: ['Thunderstorm', 'thunderstorm'],
}

async function fetchWeather() {
  const coords = await new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, place: 'Your location' }),
      () => resolve(null),
      { timeout: 8000 }
    )
  })
  const { lat, lon, place } = coords || { lat: 39.7392, lon: -104.9903, place: 'Denver, CO (default)' }
  const url = `${API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=uv_index_max,sunrise,sunset,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather service unavailable')
  const j = await res.json()
  return {
    place,
    w: {
      temp: Math.round(j.current.temperature_2m),
      humidity: j.current.relative_humidity_2m,
      rain: j.current.precipitation_probability ?? j.daily.precipitation_probability_max[0] ?? 0,
      wind: Math.round(j.current.wind_speed_10m),
      code: j.current.weather_code,
      uv: Math.round(j.daily.uv_index_max[0]),
      sunrise: j.daily.sunrise[0].slice(11, 16),
      sunset: j.daily.sunset[0].slice(11, 16),
    },
    daily: j.daily,
  }
}

// One fetch feeds both the Today banner and the Conditions page — the sky
// doesn't change fast enough to justify hitting the API on every tab switch.
let cache = null
const TTL = 10 * 60 * 1000

export function useWeather() {
  const [state, setState] = useState(() => (cache && Date.now() - cache.at < TTL ? cache : { loading: true }))

  useEffect(() => {
    if (cache && Date.now() - cache.at < TTL) return
    let alive = true
    refresh((s) => alive && setState(s))
    return () => { alive = false }
  }, [])

  return { ...state, reload: () => refresh(setState) }
}

function refresh(setState) {
  setState({ loading: true })
  fetchWeather()
    .then((data) => {
      cache = { ...data, loading: false, at: Date.now() }
      setState(cache)
    })
    .catch((e) => setState({ loading: false, error: e.message }))
}
