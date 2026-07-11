import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Sparkline, Stat, Bar, Modal } from '../components/ui'
import { bmiLabel, todayISO } from '../lib/calc'

export default function Weight() {
  const data = useData()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState(12)
  if (!data) return null
  const { d, profile } = data

  const series = d.weights.slice(-range)
  const values = series.map((w) => w.weightLb)
  const latest = d.weights[d.weights.length - 1]

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
        <Sparkline data={values} trend height={140} color="#A3F015" />
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-volt-500 inline-block" /> Daily weigh-ins</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-surge-400 inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#43E9FF 0 3px,transparent 3px 6px)' }} /> Trend</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>Progress to Goal</SectionTitle>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Start {d.startWeight} lb</span>
          <span className="text-slate-400">Goal {profile.goalWeightLb} lb</span>
        </div>
        <Bar value={d.goalPct} goal={100} />
        <div className="text-sm mt-2">
          <span className="font-display font-bold text-volt-400">{d.lbsLost.toFixed(1)} lb down</span>
          <span className="text-slate-500"> · {Math.max(0, d.currentWeight - profile.goalWeightLb).toFixed(1)} lb to go · {d.goalPct}% there</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Weekly Change" value={`${d.lastWeek >= 0 ? '−' : '+'}${Math.abs(d.lastWeek).toFixed(1)} lb`} accent={d.lastWeek >= 0 ? 'text-volt-400' : 'text-ember-400'} />
        <Stat label="Avg Weekly Loss" value={`${d.avgWeeklyLoss} lb`} sub="since you started" />
        <Stat label="BMI" value={d.bmiValue ? d.bmiValue.toFixed(1) : '—'} sub={bmiLabel(d.bmiValue)} />
        <Stat label="Body Fat" value={latest?.bodyFat ? `${latest.bodyFat}%` : '—'} sub="optional" />
      </div>

      <Card>
        <SectionTitle>Measurements</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Waist', latest?.waist], ['Hips', latest?.hip], ['Chest', latest?.chest]].map(([k, v]) => (
            <div key={k} className="card-tight">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div>
              <div className="font-display text-xl font-bold text-white tabular-nums">{v ? `${v}"` : '—'}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Measurements move when the scale stalls. If you're skating hard, that's often muscle doing its job.
        </p>
      </Card>

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

      <LogModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function LogModal({ open, onClose }) {
  const data = useData()
  const [f, setF] = useState({ date: todayISO(), weightLb: '', bodyFat: '', waist: '', hip: '', chest: '' })
  if (!open) return null
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  return (
    <Modal open onClose={onClose} title="Log a weigh-in">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date</label><input type="date" className="input" value={f.date} onChange={set('date')} /></div>
          <div><label className="label">Weight (lb)</label><input type="number" step="0.1" className="input" placeholder={String(data.d.currentWeight)} value={f.weightLb} onChange={set('weightLb')} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Body Fat % (opt)</label><input type="number" step="0.1" className="input" value={f.bodyFat} onChange={set('bodyFat')} /></div>
          <div><label className="label">Waist (in)</label><input type="number" step="0.1" className="input" value={f.waist} onChange={set('waist')} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Hips (in)</label><input type="number" step="0.1" className="input" value={f.hip} onChange={set('hip')} /></div>
          <div><label className="label">Chest (in)</label><input type="number" step="0.1" className="input" value={f.chest} onChange={set('chest')} /></div>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!f.weightLb}
          onClick={() => {
            data.addWeight({
              date: f.date,
              weightLb: +f.weightLb,
              bodyFat: f.bodyFat ? +f.bodyFat : undefined,
              waist: f.waist ? +f.waist : undefined,
              hip: f.hip ? +f.hip : undefined,
              chest: f.chest ? +f.chest : undefined,
            })
            onClose()
          }}
        >
          Save entry
        </button>
        <p className="text-xs text-slate-500 text-center">Weigh in weekly, same time of day. Daily is noise.</p>
      </div>
    </Modal>
  )
}
