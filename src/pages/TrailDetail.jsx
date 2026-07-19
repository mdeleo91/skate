import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card } from '../components/ui'
import Icon from '../components/icons'
import TrackMap from '../components/TrackMap'
import { getCachedTrail, fetchTrailAmenities } from '../lib/trails'
import { trailCoverage, trailBearing, windPlan, outAndBack, compass } from '../lib/trailMatch'
import { levelColor } from '../lib/track'
import { useWeather } from '../lib/weather'
import { getCurrentPosition } from '../lib/geo'
import { fmtDuration } from '../lib/calc'

const COVERED = '#2DD4BF'
const UNCOVERED = '#64748b'
const MODES = [['trail', 'Trail'], ['covered', 'Skated'], ['surface', 'Surface']]

export default function TrailDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const data = useData()
  const [mode, setMode] = useState('trail')
  const [amenities, setAmenities] = useState(undefined) // undefined = loading, null = failed
  const [targetMi, setTargetMi] = useState(6)
  const [here, setHere] = useState(null)
  const wx = useWeather()

  const saved = (data?.trails || []).find((t) => t.id === id)
  const trail = saved || getCachedTrail(id)

  useEffect(() => {
    if (!trail) return
    let alive = true
    fetchTrailAmenities(trail).then((a) => alive && setAmenities(a))
    getCurrentPosition({ timeout: 6000 }).then((p) => alive && setHere({ lat: p.coords.latitude, lon: p.coords.longitude })).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail?.id])

  const cov = useMemo(
    () => (trail && data ? trailCoverage(trail, data.workouts) : null),
    [trail, data?.workouts]
  )

  const trailStats = useMemo(() => {
    if (!trail || !data || !cov) return null
    const mine = data.workouts.filter((w) =>
      w.trailId === trail.id || cov.workoutIds.has(w.id))
    const miles = mine.reduce((a, w) => a + (w.miles || 0), 0)
    const fastest = mine.reduce((a, w) => Math.max(a, w.avgSpeed || 0), 0)
    const longest = mine.reduce((a, w) => Math.max(a, w.miles || 0), 0)
    return { sessions: mine.length, miles, fastest, longest }
  }, [trail, data, cov])

  if (!data) return null
  if (!trail) {
    return (
      <div className="card text-center py-10">
        <div className="mb-2 text-slate-400"><Icon name="travel_explore" size={32} /></div>
        <div className="text-slate-200 font-semibold">Trail not loaded</div>
        <div className="text-sm text-slate-500 mt-1">Search again and open it from the results.</div>
        <Link to="/trails" className="btn-ghost mt-4 inline-flex">Find Trails</Link>
      </div>
    )
  }

  const lengthMi = trail.lengthM / 1609.344
  const bearing = trailBearing(trail.segments)
  const wind = !wx.loading && !wx.error && wx.w ? windPlan(bearing, wx.w.windDir, wx.w.wind) : null
  const plan = outAndBack(trail, targetMi, here || trail.nearest)

  const pathColors = mode === 'trail'
    ? null
    : trail.segments.map((seg, si) => seg.map((_, i) => {
        if (mode === 'covered') return cov.covered[si][i] ? COVERED : UNCOVERED
        const lvl = cov.levels[si][i]
        return lvl != null ? levelColor(lvl) : UNCOVERED
      }))

  const maps = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lon.toFixed(6)}`

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="h-title truncate">{trail.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            ~{lengthMi.toFixed(1)} mi mapped{trail.surface ? ` · ${trail.surface}` : ''}
            {bearing != null ? ` · runs ${compass(bearing)}–${compass(bearing + 180)}` : ''}
          </p>
        </div>
        <button
          onClick={() => (saved ? data.removeTrail(trail.id) : data.saveTrail(trail))}
          className="btn-ghost !px-3 shrink-0"
          aria-label={saved ? 'Unsave trail' : 'Save trail'}
        >
          <Icon name={saved ? 'star_filled' : 'star'} size={18} className={saved ? 'text-volt-400' : ''} />
        </button>
      </div>

      <div>
        <TrackMap paths={trail.segments} pathColors={pathColors} height={300} />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1.5">
            {MODES.map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)}
                className={`chip !px-3 !py-1.5 ${mode === k ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>
                {l}
              </button>
            ))}
          </div>
          <a href={maps(trail.nearest)} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5 !px-3 text-xs">
            <Icon name="my_location" size={14} /> Directions
          </a>
        </div>
        {mode !== 'trail' && (
          <p className="text-xs text-slate-500 mt-1.5">
            {mode === 'covered'
              ? 'Teal is pavement you\'ve skated; grey is still unexplored.'
              : 'Colored by your measured roughness — green smooth, orange rough. Grey stretches have no data yet.'}
          </p>
        )}
      </div>

      <button
        onClick={() => nav(`/live?type=trail&name=${encodeURIComponent(trail.name)}&trail=${trail.id}`)}
        className="btn-primary w-full !py-3.5"
      >
        <Icon name="roller_skating" size={19} /> Skate this trail
      </button>

      {/* Your history on this trail */}
      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your Progress</div>
          <div className="font-display text-xl font-bold text-volt-400 tabular-nums">{cov.pct}%</div>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mt-2">
          <div className="h-full rounded-full bg-volt-500 transition-all" style={{ width: `${cov.pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mt-3">
          {[
            ['Sessions', trailStats.sessions],
            ['Your Miles', trailStats.miles.toFixed(1)],
            ['Fastest Avg', trailStats.fastest ? `${trailStats.fastest.toFixed(1)} mph` : '—'],
          ].map(([k, v]) => (
            <div key={k} className="card-tight !p-2">
              <div className="text-[10px] uppercase text-slate-500">{k}</div>
              <div className="font-display font-bold text-white tabular-nums mt-0.5">{v}</div>
            </div>
          ))}
        </div>
        {cov.smoothest && (
          <div className="text-xs text-slate-400 mt-3">
            Smoothest stretch you've measured: <span className="text-volt-400 font-semibold">
            level {cov.smoothest.avgLevel}/10</span> over ~{(cov.smoothest.lengthM / 1609.344).toFixed(1)} mi.{' '}
            <a className="text-slate-300 underline" href={maps(cov.smoothest.midpoint)} target="_blank" rel="noreferrer">Map it</a>
          </div>
        )}
        {cov.pct === 0 && (
          <p className="text-xs text-slate-500 mt-3">Skate it with GPS and this fills in — covered pavement, roughness, and per-trail records.</p>
        )}
      </Card>

      {/* Today's wind vs the trail's axis */}
      {wind && (
        <Card className="flex items-center gap-3">
          <span className="text-surge-400 shrink-0"><Icon name="partly_cloudy_day" size={24} /></span>
          <div className="text-sm text-slate-300">
            {wind.cross
              ? `Wind is mostly a crosswind today (${wx.w.wind} mph) — direction won't matter much.`
              : <>Wind is {wx.w.wind} mph from the {compass(wx.w.windDir)} — <span className="text-white font-semibold">start heading {wind.startHeading}</span> for a headwind out and a tailwind home.</>}
          </div>
        </Card>
      )}

      {/* Out-and-back planner */}
      <Card>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Plan an Out-and-Back</div>
        <div className="flex gap-1.5">
          {[4, 6, 8, 10].map((mi) => (
            <button key={mi} onClick={() => setTargetMi(mi)}
              className={`chip !px-3 !py-1.5 ${targetMi === mi ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>
              {mi} mi
            </button>
          ))}
        </div>
        {plan && (
          <div className="text-sm text-slate-300 mt-3">
            {plan.limited
              ? <>The mapped stretch tops out at <span className="text-white font-semibold">{plan.totalMiles} mi</span> round trip from {here ? 'your position' : 'the near end'}.</>
              : <>Turn around at the <span className="text-white font-semibold">{(plan.totalMiles / 2).toFixed(1)} mi</span> mark for a {plan.totalMiles} mi round trip.</>}{' '}
            <a className="text-volt-400 font-semibold" href={maps(plan.turnaround)} target="_blank" rel="noreferrer">
              Turnaround point →
            </a>
          </div>
        )}
      </Card>

      {/* Amenities from OSM */}
      <Card>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Along the Trail</div>
        {amenities === undefined && <div className="text-sm text-slate-500">Checking for parking, water and restrooms…</div>}
        {amenities === null && <div className="text-sm text-slate-500">Couldn't load amenities right now.</div>}
        {amenities && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['local_parking', 'Parking', amenities.counts.parking, amenities.nearest.parking],
              ['water_drop', 'Water', amenities.counts.water, amenities.nearest.water],
              ['wc', 'Restrooms', amenities.counts.toilets, amenities.nearest.toilets],
            ].map(([icon, label, count, near]) => (
              <div key={label} className="card-tight !p-2.5">
                <div className="text-slate-300"><Icon name={icon} size={20} /></div>
                <div className="font-display font-bold text-white tabular-nums mt-0.5">{count}</div>
                <div className="text-[10px] uppercase text-slate-500">{label}</div>
                {count > 0 && near && (
                  <a href={maps(near)} target="_blank" rel="noreferrer" className="text-[10px] text-volt-400 font-semibold">nearest →</a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sessions on this trail */}
      {trailStats.sessions > 0 && (
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Sessions Here</div>
          <div className="divide-y divide-white/5">
            {data.workouts
              .filter((w) => w.trailId === trail.id || cov.workoutIds.has(w.id))
              .slice(0, 5)
              .map((w) => (
                <Link key={w.id} to={`/session/${w.id}`} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-100 truncate">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.date} · {fmtDuration((w.durationSec ?? w.minutes * 60))}{w.miles ? ` · ${w.miles.toFixed(1)} mi` : ''}</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-volt-400">{w.avgSpeed ? `${w.avgSpeed} mph` : ''}</div>
                </Link>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
