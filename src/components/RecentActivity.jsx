import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Icon from './icons'
import LogSkateModal from './LogSkateModal'
import { Card, SectionTitle } from './ui'
import { fmtDuration } from '../lib/calc'

export default function RecentActivity() {
  const data = useData()
  const [logOpen, setLogOpen] = useState(false)
  if (!data) return null
  const { d } = data

  return (
    <Card>
      <SectionTitle
        action={(
          <span className="flex items-center gap-3">
            <button onClick={() => setLogOpen(true)} className="text-xs text-volt-400 font-semibold">+ Log skate</button>
            <Link to="/history" className="text-xs text-volt-400 font-semibold">History</Link>
          </span>
        )}
      >Recent Activity</SectionTitle>
      {d.hasWorkouts ? (
        <div className="divide-y divide-white/5">
          {data.workouts.slice(0, 4).map((w) => (
            <div key={w.id} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-700 text-slate-300">
                <Icon name={w.kind === 'strength' ? 'fitness_center' : w.kind === 'recovery' ? 'eco' : 'roller_skating'} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-100 truncate">{w.name}</div>
                <div className="text-xs text-slate-500">{w.date} · {fmtDuration(w.minutes * 60)}{w.miles ? ` · ${w.miles.toFixed(1)} mi` : ''}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums text-volt-400">{w.calories} cal</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-400 py-1">
          Nothing logged yet. Your sessions collect here — every one counts, even the short easy ones.
          <button onClick={() => setLogOpen(true)} className="btn-ghost mt-3 !py-1.5 text-xs flex">Log a past skate</button>
        </div>
      )}
      <LogSkateModal open={logOpen} onClose={() => setLogOpen(false)} />
    </Card>
  )
}
