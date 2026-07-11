import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SKATE_TYPES } from '../lib/skateTypes'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Modal } from '../components/ui'
import { caloriesForSkate, todayISO } from '../lib/calc'

const RING = { volt: 'hover:border-volt-500/50', surge: 'hover:border-surge-500/50', ember: 'hover:border-ember-500/50' }
const TEXT = { volt: 'text-volt-400', surge: 'text-surge-400', ember: 'text-ember-400' }

export default function SkateStart() {
  const nav = useNavigate()
  const data = useData()
  const [selected, setSelected] = useState(null)
  const [manual, setManual] = useState(null)
  const [strength, setStrength] = useState(false)

  if (!data) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Start a Skate</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every discipline burns differently and tracks differently. Pick what you're actually doing today.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SKATE_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`card text-left transition border-white/5 ${RING[t.color]} hover:bg-ink-700/60`}
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{t.emoji}</span>
              <span className={`chip bg-white/5 ${TEXT[t.color]}`}>{t.met} MET</span>
            </div>
            <div className="font-display font-bold text-white mt-2">{t.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{t.blurb}</div>
            <div className="flex flex-wrap gap-1 mt-2.5">
              {t.stats.map((s) => (
                <span key={s} className="chip bg-ink-700 text-slate-400">{s}</span>
              ))}
            </div>
            {!t.gpsBased && <div className="text-[11px] text-slate-500 mt-2">Time-based · no GPS needed</div>}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <SectionTitle>Not skating today?</SectionTitle>
          <p className="text-sm text-slate-400 mb-3">
            Strength and recovery days build skaters too. They count toward your streak.
          </p>
          <button onClick={() => setStrength(true)} className="btn-ghost w-full">💪 Log a strength session</button>
        </Card>
        <Card>
          <SectionTitle>Already skated?</SectionTitle>
          <p className="text-sm text-slate-400 mb-3">
            Forgot to hit start? Enter it manually — no session is wasted.
          </p>
          <button onClick={() => setManual(SKATE_TYPES[0])} className="btn-ghost w-full">✍️ Log a past skate</button>
        </Card>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.emoji} ${selected.name}` : ''}>
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{selected.blurb}</p>
            <div className="card-tight text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 mb-1">This session tracks</div>
              {selected.stats.map((s) => <div key={s}>· {s}</div>)}
            </div>
            <button
              className="btn-primary w-full"
              onClick={() => nav(`/live?type=${selected.id}`)}
            >
              Start live session
            </button>
            <button className="btn-ghost w-full" onClick={() => { setManual(selected); setSelected(null) }}>
              Enter manually instead
            </button>
          </div>
        )}
      </Modal>

      <ManualModal type={manual} onClose={() => setManual(null)} />
      <StrengthModal open={strength} onClose={() => setStrength(false)} />
    </div>
  )
}

function ManualModal({ type, onClose }) {
  const data = useData()
  const nav = useNavigate()
  const [typeId, setTypeId] = useState(type?.id || 'outdoor-fitness')
  const [form, setForm] = useState({ name: '', minutes: 45, miles: 6, topSpeed: 16, elevation: 100, date: todayISO() })

  if (!type) return null
  const t = SKATE_TYPES.find((x) => x.id === typeId)
  const avg = form.miles && form.minutes ? +(form.miles / (form.minutes / 60)).toFixed(1) : 0
  const cal = caloriesForSkate({ typeId, minutes: +form.minutes, avgSpeedMph: avg, weightLb: data.profile.weightLb })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Modal open onClose={onClose} title="Log a skate">
      <div className="space-y-3">
        <div>
          <label className="label">Discipline</label>
          <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {SKATE_TYPES.map((x) => <option key={x.id} value={x.id}>{x.emoji} {x.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Session name</label>
          <input className="input" placeholder="Riverfront Loop" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={set('date')} /></div>
          <div><label className="label">Minutes</label><input type="number" min="1" className="input" value={form.minutes} onChange={set('minutes')} /></div>
        </div>
        {t.gpsBased && (
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Miles</label><input type="number" step="0.1" className="input" value={form.miles} onChange={set('miles')} /></div>
            <div><label className="label">Top mph</label><input type="number" step="0.1" className="input" value={form.topSpeed} onChange={set('topSpeed')} /></div>
            <div><label className="label">Elev ft</label><input type="number" className="input" value={form.elevation} onChange={set('elevation')} /></div>
          </div>
        )}
        <div className="card-tight flex items-center justify-between">
          <span className="text-sm text-slate-400">Estimated burn</span>
          <span className="font-display text-xl font-bold text-volt-400 tabular-nums">{cal} cal</span>
        </div>
        <button
          className="btn-primary w-full"
          onClick={() => {
            data.addWorkout({
              date: form.date,
              kind: 'skate',
              typeId,
              name: form.name || t.name,
              minutes: +form.minutes,
              miles: t.gpsBased ? +form.miles : 0,
              avgSpeed: t.gpsBased ? avg : 0,
              topSpeed: t.gpsBased ? +form.topSpeed : 0,
              elevation: t.gpsBased ? +form.elevation : 0,
              calories: cal,
              laps: [],
              route: [],
              source: 'manual',
            })
            onClose()
            nav('/history')
          }}
        >
          Save skate
        </button>
      </div>
    </Modal>
  )
}

function StrengthModal({ open, onClose }) {
  const data = useData()
  const [form, setForm] = useState({ name: 'Legs & Core', minutes: 30, date: todayISO(), kind: 'strength' })
  if (!open) return null
  const cal = Math.round(form.minutes * (form.kind === 'strength' ? 6.2 : 3.4))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <Modal open onClose={onClose} title="Log a session">
      <div className="space-y-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.kind} onChange={set('kind')}>
            <option value="strength">💪 Strength</option>
            <option value="recovery">🌿 Recovery / mobility</option>
          </select>
        </div>
        <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={set('date')} /></div>
          <div><label className="label">Minutes</label><input type="number" className="input" value={form.minutes} onChange={set('minutes')} /></div>
        </div>
        <div className="card-tight flex items-center justify-between">
          <span className="text-sm text-slate-400">Estimated burn</span>
          <span className="font-display text-xl font-bold text-volt-400 tabular-nums">{cal} cal</span>
        </div>
        <button
          className="btn-primary w-full"
          onClick={() => {
            data.addWorkout({
              date: form.date, kind: form.kind, typeId: null, name: form.name,
              minutes: +form.minutes, miles: 0, avgSpeed: 0, topSpeed: 0, elevation: 0,
              calories: cal, laps: [], route: [], source: 'manual',
            })
            onClose()
          }}
        >
          Save session
        </button>
      </div>
    </Modal>
  )
}
