import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Modal } from '../components/ui'
import Icon from '../components/icons'
import TrackMap from '../components/TrackMap'
import { getSkateType } from '../lib/skateTypes'
import { fmtDuration, fmtPace } from '../lib/calc'
import { computeSplits, terrainStats } from '../lib/track'

const TABS = ['Overview', 'Splits', 'Map']

export default function SkateDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const data = useData()
  const [tab, setTab] = useState('Overview')
  const [mapColor, setMapColor] = useState('speed')
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // All hooks must run on every render — the loading render (data still
  // hydrating from storage) and the loaded render must agree on hook count.
  const w = data?.workouts.find((x) => x.id === id)
  const splits = useMemo(() => computeSplits(w?.route), [w?.route])
  useEffect(() => {
    // Deleted or bad link — nothing to show here. (Redirect only once data
    // has hydrated; before that, absence just means "still loading".)
    if (data && !w) nav('/history', { replace: true })
  }, [data, w, nav])

  if (!data || !w) return null

  const t = w.typeId ? getSkateType(w.typeId) : null
  const icon = w.kind === 'strength' ? 'fitness_center' : w.kind === 'recovery' && !w.typeId ? 'eco' : t?.icon || 'roller_skating'
  const durationSec = w.durationSec ?? w.minutes * 60
  const hasTrack = w.route?.length > 2

  const prs = data.d.prs
  const records = [
    w.miles > 0 && w.miles >= prs.longestDistance && { icon: 'military_tech', label: 'Longest Distance', value: `${w.miles.toFixed(2)} mi` },
    w.avgSpeed > 0 && w.avgSpeed >= prs.fastestAvg && { icon: 'bolt', label: 'Fastest Avg Speed', value: `${w.avgSpeed.toFixed(1)} mph` },
    w.topSpeed > 0 && w.topSpeed >= prs.fastestTop && { icon: 'rocket_launch', label: 'Fastest Top Speed', value: `${w.topSpeed.toFixed(1)} mph` },
    w.minutes > 0 && w.minutes >= prs.longestWorkout && { icon: 'timer', label: 'Longest Session', value: fmtDuration(durationSec) },
    w.calories > 0 && w.calories >= prs.mostCalories && { icon: 'local_fire_department', label: 'Most Calories', value: `${w.calories} kcal` },
  ].filter(Boolean).slice(0, 3)

  const fav = data.favoriteRoutes.some((r) => r.name === w.name)

  async function share() {
    const text = `${w.name} — ${w.miles ? `${w.miles.toFixed(2)} mi, ` : ''}${fmtDuration(durationSec)}, ${w.calories} cal on Skate`
    try {
      if (navigator.share) await navigator.share({ title: w.name, text })
      else {
        await navigator.clipboard.writeText(text)
        alert('Summary copied to clipboard')
      }
    } catch { /* user cancelled */ }
  }

  const terrain = w.terrain || terrainStats(w.route)
  const rows = [
    ...(w.miles > 0 ? [
      ['Avg Speed', w.movingSec != null ? `${w.avgSpeed} mph moving` : `${w.avgSpeed} mph`],
      ['Max Speed', `${w.topSpeed} mph`],
      ['Elevation Gain', `${w.elevation} ft`],
      ['Pace', fmtPace((w.movingSec ?? w.minutes * 60) / 60, w.miles)],
    ] : []),
    ...(w.movingSec != null ? [
      ['Moving Time', fmtDuration(w.movingSec)],
      ['Downtime', fmtDuration(w.stoppedSec ?? Math.max(0, durationSec - w.movingSec))],
    ] : []),
    ...(terrain ? [['Terrain', `${terrain.smoothPct}% smooth · ${terrain.roughPct}% rough`]] : []),
    ...(w.avgHr ? [['Avg Heart Rate', `${w.avgHr} bpm`]] : []),
    ['Source', w.source === 'gps' ? 'GPS' : w.source === 'demo' ? 'Demo mode' : w.source === 'seed' ? 'Sample data' : 'Manual entry'],
  ]

  return (
    <div className="min-h-screen max-w-2xl mx-auto flex flex-col">
      <header className="sticky top-0 z-40 bg-ink-900/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => nav('/history')} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-slate-300 hover:text-white text-xl leading-none">×</button>
          <h1 className="font-display font-bold text-white">Skate Details</h1>
          <button onClick={share} aria-label="Share" className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-slate-300 hover:text-white">
            <Icon name="share" size={17} />
          </button>
        </div>
        <div className="grid grid-cols-3 border-b border-white/5">
          {TABS.map((x) => (
            <button key={x} onClick={() => setTab(x)}
              className={`py-2.5 text-sm font-semibold border-b-2 transition ${tab === x ? 'border-volt-500 text-white' : 'border-transparent text-slate-500'}`}>
              {x}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 pb-8">
        {tab === 'Overview' && (
          <>
            <TrackMap points={w.route} height={280} className="!rounded-none" />

            <div className="px-4">
              <div className="flex items-center gap-3 py-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-700 text-slate-200">
                  <Icon name={icon} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold text-white truncate">{w.name}</div>
                  <div className="text-sm text-slate-400">{fmtWhen(w)}</div>
                </div>
                <button onClick={() => setRenaming(true)} aria-label="Rename" className="p-2 text-slate-400 hover:text-white">
                  <Icon name="edit" size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 border-y border-white/10 py-4">
                <BigStat value={w.miles ? w.miles.toFixed(2) : '—'} unit="miles" />
                <BigStat value={fmtDuration(durationSec)} unit="time" className="border-x border-white/10" />
                <BigStat value={w.calories} unit="kcal" />
              </div>

              <div className="divide-y divide-white/5">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3 text-[15px]">
                    <span className="text-slate-300">{k}</span>
                    <span className="text-white font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
              </div>

              {records.length > 0 && (
                <div className="card mt-2 !bg-volt-500/[0.04] !border-volt-500/20">
                  <div className="grid grid-cols-3 gap-2">
                    {records.map((r) => (
                      <div key={r.label} className="text-center">
                        <span
                          className="mx-auto grid h-14 w-14 place-items-center bg-volt-500/15 text-volt-400"
                          style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}
                        >
                          <Icon name={r.icon} size={26} />
                        </span>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-2">{r.label}</div>
                        <div className="font-display font-bold text-white tabular-nums mt-0.5">{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {w.laps?.length > 0 && (
                <div className="card-tight mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Laps</div>
                  {w.laps.map((l) => (
                    <div key={l.n} className="flex justify-between text-sm py-1 tabular-nums">
                      <span className="text-slate-400">Lap {l.n}</span>
                      <span className="text-slate-200">{fmtDuration(l.atSec)} · {l.miles} mi · {l.avg} mph</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-5">
                {w.miles > 0 && (
                  <button onClick={() => data.toggleFavoriteRoute(w.name)} className="btn-ghost">
                    <Icon name={fav ? 'star_filled' : 'star'} size={16} className={fav ? 'text-volt-400' : ''} />
                    {fav ? 'Favorited' : 'Favorite route'}
                  </button>
                )}
                <button onClick={() => setConfirmDelete(true)} className={`btn-ghost !text-ember-400 ${w.miles > 0 ? '' : 'col-span-2'}`}>Delete session</button>
              </div>
              <Link to="/routes" className="block text-center text-xs text-slate-500 hover:text-slate-300 mt-4">View route collection →</Link>
            </div>
          </>
        )}

        {tab === 'Splits' && (
          <div className="px-4 py-4">
            {splits.length > 0 ? (
              <>
                <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-white/10">
                  <span>Mile</span><span>Time</span><span>Avg Speed</span>
                </div>
                {splits.map((s, i) => {
                  const fastest = Math.max(...splits.map((x) => x.mph))
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                      <span className="w-10 font-display font-bold text-white tabular-nums">
                        {s.partial ? s.miles.toFixed(1) : s.mile}
                      </span>
                      <div className="flex-1">
                        <div className="h-4 rounded bg-volt-500/80" style={{ width: `${Math.max(8, (s.mph / fastest) * 100)}%` }} />
                      </div>
                      <span className="w-14 text-right text-sm text-slate-300 tabular-nums">{fmtDuration(s.seconds)}</span>
                      <span className="w-16 text-right text-sm font-semibold text-white tabular-nums">{s.mph.toFixed(1)}</span>
                    </div>
                  )
                })}
                <p className="text-xs text-slate-500 mt-3">Bar length is average speed per mile — longer is faster.</p>
              </>
            ) : (
              <div className="card text-center py-10 text-sm text-slate-400">
                No split data for this session.
                {!hasTrack && ' Splits are computed from the GPS trace — manual entries don\'t have one.'}
              </div>
            )}
          </div>
        )}

        {tab === 'Map' && (
          <div className="flex-1">
            <TrackMap points={w.route} colorBy={mapColor} height={Math.round(window.innerHeight * 0.56)} className="!rounded-none" />
            {terrain && (
              <div className="flex gap-1.5 px-4 pt-3">
                {[['speed', 'Speed'], ['surface', 'Surface']].map(([k, l]) => (
                  <button key={k} onClick={() => setMapColor(k)}
                    className={`chip !px-3 !py-1.5 ${mapColor === k ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 px-4 py-4">
              <BigStat value={w.miles ? w.miles.toFixed(2) : '—'} unit="miles" />
              <BigStat value={w.avgSpeed || '—'} unit="avg mph" className="border-x border-white/10" />
              <BigStat value={w.elevation} unit="ft gain" />
            </div>
            <p className="px-4 text-xs text-slate-500">
              {mapColor === 'surface'
                ? 'Line color is pavement quality from phone vibration — green smooth, orange rough.'
                : 'Line color is speed — green is easy, orange is flying.'}
            </p>
          </div>
        )}
      </div>

      <RenameModal open={renaming} current={w.name} onClose={() => setRenaming(false)}
        onSave={(name) => { data.updateWorkout(w.id, { name }); setRenaming(false) }} />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this session?">
        <p className="text-sm text-slate-400 mb-4">
          This removes {w.name} and its {w.miles ? `${w.miles.toFixed(1)} miles` : 'minutes'} from your
          history, stats and streaks. There's no undo.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
          <button className="btn-danger" onClick={() => { data.deleteWorkout(w.id); nav('/history') }}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}

function BigStat({ value, unit, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <div className="font-display text-3xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{unit}</div>
    </div>
  )
}

function fmtWhen(w) {
  if (w.startedAt) {
    const d = new Date(w.startedAt)
    return `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return w.date
}

function RenameModal({ open, current, onClose, onSave }) {
  if (!open) return null
  return <RenameForm current={current} onClose={onClose} onSave={onSave} />
}

function RenameForm({ current, onClose, onSave }) {
  const [name, setName] = useState(current)
  return (
    <Modal open onClose={onClose} title="Rename session">
      <div className="space-y-3">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()) }} />
        <button className="btn-primary w-full" disabled={!name.trim()} onClick={() => onSave(name.trim())}>Save</button>
        <p className="text-xs text-slate-500 text-center">Sessions with the same name group into one route.</p>
      </div>
    </Modal>
  )
}
