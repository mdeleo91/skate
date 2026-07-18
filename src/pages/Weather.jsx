import { Card, SectionTitle, Stat } from '../components/ui'
import Icon from '../components/icons'
import { useWeather, scoreConditions, CODE } from '../lib/weather'

export default function Weather() {
  const state = useWeather()

  if (state.loading) {
    return <div className="card text-center py-12 text-sm text-slate-400">Checking the sky…</div>
  }
  if (state.error) {
    return (
      <div className="card text-center py-10">
        <div className="mb-2 text-slate-400"><Icon name="foggy" size={32} /></div>
        <div className="text-slate-200 font-semibold">Couldn't reach the weather service</div>
        <div className="text-sm text-slate-500 mt-1">{state.error}</div>
        <button onClick={state.reload} className="btn-ghost mt-4">Try again</button>
      </div>
    )
  }

  const { w, daily, place } = state
  const s = scoreConditions(w)
  const [desc, codeIcon] = CODE[w.code] || ['—', 'device_thermostat']

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Skate Conditions</h1>
        <p className="text-sm text-slate-500 mt-1">{place} · via open-meteo</p>
      </div>

      <Card className={s.score >= 60 ? 'border-volt-500/30 bg-volt-500/[0.03]' : 'border-ember-500/25 bg-ember-500/[0.03]'}>
        <div className="flex items-center gap-4">
          <span className={s.score >= 60 ? 'text-volt-400' : 'text-ember-400'}><Icon name={s.icon} size={48} /></span>
          <div className="flex-1">
            <div className="font-display text-2xl font-bold text-white">{s.verdict}</div>
            <div className="text-sm text-slate-400"><Icon name={codeIcon} size={15} className="mr-1" />{desc} · {w.temp}°F</div>
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
            const [, e] = CODE[daily.weather_code[i]] || ['', 'device_thermostat']
            return (
              <div key={t} className="card-tight !p-2">
                <div className="text-[10px] uppercase text-slate-500">
                  {new Date(t + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="my-1 text-slate-300"><Icon name={e} size={22} /></div>
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
