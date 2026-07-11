import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, SectionTitle } from '../components/ui'
import { isoDay } from '../lib/calc'

const KIND_COLOR = {
  skate: 'bg-volt-500 text-ink-900',
  strength: 'bg-surge-500 text-ink-900',
  recovery: 'bg-ember-500 text-white',
}
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function CalendarPage() {
  const data = useData()
  const [offset, setOffset] = useState(0)
  if (!data) return null

  const base = new Date()
  base.setMonth(base.getMonth() + offset)
  const year = base.getFullYear()
  const month = base.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7

  const byDay = {}
  for (const w of data.workouts) {
    (byDay[w.date] ||= []).push(w)
  }

  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const monthWorkouts = data.workouts.filter((w) => w.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
  const counts = {
    skate: monthWorkouts.filter((w) => w.kind === 'skate').length,
    strength: monthWorkouts.filter((w) => w.kind === 'strength').length,
    recovery: monthWorkouts.filter((w) => w.kind === 'recovery').length,
  }
  const activeDays = new Set(monthWorkouts.map((w) => w.date)).size
  const restDays = daysInMonth - activeDays

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Activity Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Consistency, visible. Rest days are part of the plan, not a failure.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setOffset((o) => o - 1)} className="btn-ghost !px-3 !py-1.5">←</button>
          <div className="font-display font-bold text-white">
            {base.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0} className="btn-ghost !px-3 !py-1.5">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase text-slate-500 mb-1.5">
          {DOW.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />
            const key = isoDay(date)
            const items = byDay[key] || []
            const kind = items.find((w) => w.kind === 'skate') ? 'skate'
              : items.find((w) => w.kind === 'strength') ? 'strength'
              : items.length ? 'recovery' : null
            const isToday = key === isoDay(new Date())
            return (
              <div
                key={i}
                title={items.map((w) => w.name).join(', ') || 'Rest day'}
                className={`aspect-square rounded-lg grid place-items-center text-xs font-semibold transition ${
                  kind ? KIND_COLOR[kind] : 'bg-ink-700 text-slate-500'
                } ${isToday ? 'ring-2 ring-white/60' : ''}`}
              >
                {date.getDate()}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
          <Legend color="bg-volt-500" label={`Skate — ${counts.skate}`} />
          <Legend color="bg-surge-500" label={`Strength — ${counts.strength}`} />
          <Legend color="bg-ember-500" label={`Recovery — ${counts.recovery}`} />
          <Legend color="bg-ink-700" label={`Rest — ${restDays}`} />
        </div>
      </Card>

      <Card>
        <SectionTitle>This Month</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card-tight">
            <div className="text-[10px] uppercase text-slate-500">Active Days</div>
            <div className="font-display text-2xl font-bold text-volt-400">{activeDays}</div>
          </div>
          <div className="card-tight">
            <div className="text-[10px] uppercase text-slate-500">Miles</div>
            <div className="font-display text-2xl font-bold text-white">
              {monthWorkouts.reduce((a, w) => a + (w.miles || 0), 0).toFixed(1)}
            </div>
          </div>
          <div className="card-tight">
            <div className="text-[10px] uppercase text-slate-500">Calories</div>
            <div className="font-display text-2xl font-bold text-white">
              {monthWorkouts.reduce((a, w) => a + w.calories, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${color}`} />
      {label}
    </span>
  )
}
