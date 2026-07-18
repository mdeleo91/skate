import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Sparkline, Stat, Bar, EmptyState } from '../components/ui'
import WeighInModal from '../components/WeighInModal'
import { bmiLabel } from '../lib/calc'

export default function Weight() {
  const data = useData()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState(12)
  if (!data) return null
  const { d, profile } = data

  const series = d.weights.slice(-range)
  const values = series.map((w) => w.weightLb)

  if (!d.hasWeights) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="h-title">Weight</h1>
          <p className="text-sm text-slate-500 mt-1">The trend is the truth. One heavy morning is just salt and sleep.</p>
        </div>
        <EmptyState
          icon="monitor_weight"
          title="Log your starting weight"
          desc="One number, once. From there Skate draws a trend line and quietly ignores the daily noise — because water, salt and sleep move the scale more than fat ever does."
          cta="Log starting weight"
          onClick={() => setOpen(true)}
          hint="Entirely optional. You can track miles and never step on a scale."
        />
        <Card>
          <SectionTitle>How this page will work</SectionTitle>
          <p className="text-sm text-slate-400 leading-relaxed">
            Weigh in weekly, same time of day. Skate plots every entry but draws a dashed regression
            line through them — that line is the one to watch, not any single morning's number.
          </p>
        </Card>
        <WeighInModal open={open} onClose={() => setOpen(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="h-title">Weight</h1>
          <p className="text-sm text-slate-500 mt-1">The trend is the truth. One heavy morning is just salt and sleep.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary !px-4 shrink-0">+ Log</button>
      </div>

      <Card>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Current Weight</div>
            <div className="font-display text-4xl font-bold text-white tabular-nums">{d.currentWeight.toFixed(1)}<span className="text-lg text-slate-500 ml-1">lb</span></div>
          </div>
          <div className="flex gap-1">
            {[6, 12, 52].map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`chip !px-2.5 ${range === r ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>
                {r === 52 ? 'All' : `${r}w`}
              </button>
            ))}
          </div>
        </div>
        <Sparkline data={values} trend height={140} color="#2DD4BF" />
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-volt-500 inline-block" /> Daily weigh-ins</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-surge-400 inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#3B82F6 0 3px,transparent 3px 6px)' }} /> Trend</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>Progress to Goal</SectionTitle>
        {profile.goalWeightLb ? (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Start {d.startWeight} lb</span>
              <span className="text-slate-400">Goal {profile.goalWeightLb} lb</span>
            </div>
            <Bar value={d.goalPct} goal={100} />
            <div className="text-sm mt-2">
              <span className="font-display font-bold text-volt-400">{d.lbsLost.toFixed(1)} lb down</span>
              <span className="text-slate-500"> · {Math.max(0, d.currentWeight - profile.goalWeightLb).toFixed(1)} lb to go · {d.goalPct}% there</span>
            </div>
          </>
        ) : (
          <div>
            <p className="text-sm text-slate-400">
              No goal weight set yet. Set one and this fills with a progress bar — or don't, and just
              keep skating. Both are legitimate.
            </p>
            <Link to="/profile" className="btn-ghost mt-3 !py-1.5 text-xs inline-flex">Set a goal weight</Link>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Weekly Change" value={`${d.lastWeek >= 0 ? '−' : '+'}${Math.abs(d.lastWeek).toFixed(1)} lb`} accent={d.lastWeek >= 0 ? 'text-volt-400' : 'text-ember-400'} />
        <Stat label="Avg Weekly Loss" value={`${d.avgWeeklyLoss} lb`} sub="since you started" />
        <Stat label="BMI" value={d.bmiValue ? d.bmiValue.toFixed(1) : '—'} sub={bmiLabel(d.bmiValue)} />
        <Stat
          label="To Goal"
          value={profile.goalWeightLb ? `${Math.max(0, d.currentWeight - profile.goalWeightLb).toFixed(1)} lb` : '—'}
          sub={profile.goalWeightLb ? `goal ${profile.goalWeightLb} lb` : 'no goal set'}
        />
      </div>

      <Card>
        <SectionTitle>Entries</SectionTitle>
        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
          {[...d.weights].reverse().map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-400">{w.date}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums font-semibold text-slate-100">{w.weightLb} lb</span>
                <button onClick={() => data.deleteWeight(w.id)} className="text-slate-600 hover:text-ember-400">×</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <WeighInModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

