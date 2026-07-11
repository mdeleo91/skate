import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { EmptyState } from '../components/ui'
import Icon from '../components/icons'
import LogSkateModal from '../components/LogSkateModal'
import { getSkateType } from '../lib/skateTypes'
import { fmtDuration } from '../lib/calc'

export default function History() {
  const data = useData()
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')
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
              <button key={w.id} onClick={() => nav(`/session/${w.id}`)} className="card w-full text-left hover:border-volt-500/30 transition">
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

      <LogSkateModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}

