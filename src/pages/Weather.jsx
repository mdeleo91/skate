import { useEffect, useState } from 'react'
import { Card, SectionTitle, Stat } from '../components/ui'

// open-meteo.com — free, no API key required.
const API = 'https://api.open-meteo.com/v1/forecast'

function scoreConditions(w) {
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
  const emoji = score >= 80 ? '🛼' : score >= 60 ? '👍' : score >= 40 ? '🤔' : '🏠'
  return { score, verdict, emoji, notes }
}

const CODE = {
  0: ['Clear', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'],
  55: ['Heavy drizzle', '🌧️'], 61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '⛈️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 80: ['Showers', '🌦️'],
  81: ['Showers', '🌧️'], 82: ['Heavy showers', '⛈️'], 95: ['Thunderstorm', '⛈️'],
}

export default function Weather() {
  const [state, setState] = useState({ loading: true })

  useEffect(() => { load() }, [])

  function load(coords) {
    setState({ loading: true })
    const go = async (lat, lon, place) => {
      try {
        const url = `${API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=uv_index_max,sunrise,sunset,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Weather service unavailable')
        const j = await res.json()
        setState({
          loading: false,
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
        })
      } catch (e) {
        setState({ loading: false, error: e.message })
      }
    }

    if (coords) return go(coords.lat, coords.lon, 'Your location')
    if (!navigator.geolocation) return go(39.7392, -104.9903, 'Denver, CO (default)')
    navigator.geolocation.getCurrentPosition(
      (pos) => go(pos.coords.latitude, pos.coords.longitude, 'Your location'),
      () => go(39.7392, -104.9903, 'Denver, CO (location denied)'),
      { timeout: 8000 }
    )
  }

  if (state.loading) {
    return <div className="card text-center py-12 text-sm text-slate-400">Checking the sky…</div>
  }
  if (state.error) {
    return (
      <div className="card text-center py-10">
        <div className="text-3xl mb-2">🌫️</div>
        <div className="text-slate-200 font-semibold">Couldn't reach the weather service</div>
        <div className="text-sm text-slate-500 mt-1">{state.error}</div>
        <button onClick={() => load()} className="btn-ghost mt-4">Try again</button>
      </div>
    )
  }

  const { w, daily, place } = state
  const s = scoreConditions(w)
  const [desc, emoji] = CODE[w.code] || ['—', '🌡️']

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Skate Conditions</h1>
        <p className="text-sm text-slate-500 mt-1">{place} · via open-meteo</p>
      </div>

      <Card className={s.score >= 60 ? 'border-volt-500/30 bg-volt-500/[0.03]' : 'border-ember-500/25 bg-ember-500/[0.03]'}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{s.emoji}</span>
          <div className="flex-1">
            <div className="font-display text-2xl font-bold text-white">{s.verdict}</div>
            <div className="text-sm text-slate-400">{emoji} {desc} · {w.temp}°F</div>
          </div>
          <div className="text-right">
            <div className={`font-display text-3xl font-bold tabular-nums ${s.score >= 60 ? 'text-volt-400' : 'text-ember-400'}`}>{s.score}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Skate score</div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {s.notes.map((n, i) => <div key={i} className="text-sm text-slate-300">· {n}</div>)}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Temperature" value={`${w.temp}°F`} />
        <Stat label="Wind Speed" value={`${w.wind} mph`} accent={w.wind > 18 ? 'text-ember-400' : 'text-white'} />
        <Stat label="Chance of Rain" value={`${w.rain}%`} accent={w.rain > 40 ? 'text-ember-400' : 'text-white'} />
        <Stat label="UV Index" value={w.uv} accent={w.uv >= 8 ? 'text-ember-400' : 'text-white'} />
        <Stat label="Humidity" value={`${w.humidity}%`} />
        <Stat label="Daylight" value={`${w.sunrise}–${w.sunset}`} sub="sunrise / sunset" />
      </div>

      <Card>
        <SectionTitle>Next 5 Days</SectionTitle>
        <div className="grid grid-cols-5 gap-2 text-center">
          {daily.time.slice(0, 5).map((t, i) => {
            const [, e] = CODE[daily.weather_code[i]] || ['', '🌡️']
            return (
              <div key={t} className="card-tight !p-2">
                <div className="text-[10px] uppercase text-slate-500">
                  {new Date(t + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xl my-1">{e}</div>
                <div className="text-xs font-semibold text-white tabular-nums">{Math.round(daily.temperature_2m_max[i])}°</div>
                <div className="text-[10px] text-slate-500 tabular-nums">{Math.round(daily.temperature_2m_min[i])}° · {daily.precipitation_probability_max[i] ?? 0}%</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
