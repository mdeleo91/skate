import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, RouteMap, EmptyState, Modal } from '../components/ui'
import Icon from '../components/icons'
import LogSkateModal from '../components/LogSkateModal'
import { getSkateType } from '../lib/skateTypes'
import { fmtDuration, fmtPace } from '../lib/calc'

export default function History() {
  const data = useData()
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [logOpen, setLogOpen] = useState(false)
  if (!data) return null

  const list = data.workouts.filter((w) => (filter === 'all' ? true : filter === 'skate' ? w.kind === 'skate' : w.kind !== 'skate'))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="h-title">Skate History</h1>
          <p className="text-sm text-slate-500 mt-1">Every session you logged. Nothing here is wasted.</p>
        </div>
        <button onClick={() => setLogOpen(true)} className="btn-primary !px-4 shrink-0">+ Log skate</button>
      </div>

      <div className="flex gap-1.5">
        {[['all', 'All'], ['skate', 'Skates'], ['other', 'Strength & Recovery']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`chip !px-3 !py-1.5 ${filter === k ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon="history" title="Nothing logged yet" desc="Your first skate is the hardest one to start." cta="Start a skate" to="/skate">
          <div className="mt-3">
            <button onClick={() => setLogOpen(true)} className="btn-ghost text-xs !py-1.5">Already skated? Log it manually</button>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {list.map((w) => {
            const t = w.typeId ? getSkateType(w.typeId) : null
            return (
              <button key={w.id} onClick={() => setOpen(w)} className="card w-full text-left hover:border-volt-500/30 transition">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-700 text-slate-300">
                    <Icon name={w.kind === 'strength' ? 'fitness_center' : w.kind === 'recovery' ? 'eco' : t?.icon || 'roller_skating'} size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-100 truncate">{w.name}</div>
                    <div className="text-xs text-slate-500">
                      {w.date} · {t ? t.name : w.kind === 'strength' ? 'Strength' : 'Recovery'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold tabular-nums text-white">
                      {w.miles ? `${w.miles.toFixed(1)} mi` : fmtDuration(w.minutes * 60)}
                    </div>
                    <div className="text-xs text-volt-400 tabular-nums">{w.calories} cal</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name || ''}>
        {open && <Detail w={open} onDelete={() => { data.deleteWorkout(open.id); setOpen(null) }} />}
      </Modal>

      <LogSkateModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}

function Detail({ w, onDelete }) {
  const { toggleFavoriteRoute, favoriteRoutes } = useData()
  const fav = favoriteRoutes.some((r) => r.name === w.name)
  const t = w.typeId ? getSkateType(w.typeId) : null
  const rows = [
    ['Date', w.date],
    ['Discipline', t ? t.name : w.kind],
    ['Duration', fmtDuration(w.minutes * 60)],
    ...(w.miles ? [
      ['Distance', `${w.miles.toFixed(2)} mi`],
      ['Avg Speed', `${w.avgSpeed} mph`],
      ['Top Speed', `${w.topSpeed} mph`],
      ['Pace', fmtPace(w.minutes, w.miles)],
      ['Elevation Gain', `${w.elevation} ft`],
    ] : []),
    ['Calories', `${w.calories} cal`],
    ['Source', w.source === 'gps' ? 'GPS' : w.source === 'demo' ? 'Demo mode' : w.source === 'seed' ? 'Sample data' : 'Manual entry'],
  ]
  return (
    <div className="space-y-4">
      {w.route?.length > 2 && <RouteMap points={w.route} />}
      <div className="card-tight divide-y divide-white/5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5 text-sm">
            <span className="text-slate-400">{k}</span>
            <span className="text-slate-100 font-medium tabular-nums">{v}</span>
          </div>
        ))}
      </div>
      {w.laps?.length > 0 && (
        <div className="card-tight">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Laps</div>
          {w.laps.map((l) => (
            <div key={l.n} className="flex justify-between text-sm py-1 tabular-nums">
              <span className="text-slate-400">Lap {l.n}</span>
              <span className="text-slate-200">{fmtDuration(l.atSec)} · {l.miles} mi · {l.avg} mph</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {w.miles > 0 && (
          <button onClick={() => toggleFavoriteRoute(w.name)} className="btn-ghost">
            <Icon name={fav ? 'star_filled' : 'star'} size={16} className={fav ? 'text-volt-400' : ''} />
            {fav ? 'Favorited' : 'Favorite route'}
          </button>
        )}
        <button onClick={onDelete} className="btn-ghost !text-ember-400">Delete</button>
      </div>
      <Link to="/routes" className="block text-center text-xs text-slate-500 hover:text-slate-300">View route collection →</Link>
    </div>
  )
}
