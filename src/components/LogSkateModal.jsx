import { useState } from 'react'
import { SKATE_TYPES } from '../lib/skateTypes'
import { useData } from '../context/DataContext'
import { Modal } from './ui'
import { caloriesForSkate, todayISO } from '../lib/calc'

// Manual skate entry, available anywhere a session might need logging after the
// fact — Skate Start, History, Dashboard. GPS is the nice path, not the only path.
export default function LogSkateModal({ open, initialTypeId, onClose, onSaved }) {
  if (!open) return null
  // Keyed remount so reopening with a different discipline starts a fresh form.
  return <LogSkateForm key={initialTypeId || 'default'} initialTypeId={initialTypeId} onClose={onClose} onSaved={onSaved} />
}

function LogSkateForm({ initialTypeId, onClose, onSaved }) {
  const data = useData()
  const [typeId, setTypeId] = useState(initialTypeId || 'outdoor-fitness')
  const [form, setForm] = useState({ name: '', minutes: 45, miles: 6, topSpeed: 16, elevation: 100, date: todayISO() })

  const t = SKATE_TYPES.find((x) => x.id === typeId) || SKATE_TYPES[0]
  const avg = form.miles && form.minutes ? +(form.miles / (form.minutes / 60)).toFixed(1) : 0
  const cal = caloriesForSkate({ typeId, minutes: +form.minutes, avgSpeedMph: avg, weightLb: data.profile.weightLb })
  const valid = +form.minutes > 0 && form.date && form.date <= todayISO() && (!t.gpsBased || +form.miles >= 0)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function save() {
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
    onSaved?.()
  }

  return (
    <Modal open onClose={onClose} title="Log a skate">
      <div className="space-y-3">
        <div>
          <label className="label">Discipline</label>
          <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {SKATE_TYPES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Session name</label>
          <input className="input" placeholder="Riverfront Loop" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date</label><input type="date" max={todayISO()} className="input" value={form.date} onChange={set('date')} /></div>
          <div><label className="label">Minutes</label><input type="number" min="1" className="input" value={form.minutes} onChange={set('minutes')} /></div>
        </div>
        {t.gpsBased && (
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Miles</label><input type="number" step="0.1" min="0" className="input" value={form.miles} onChange={set('miles')} /></div>
            <div><label className="label">Top mph</label><input type="number" step="0.1" min="0" className="input" value={form.topSpeed} onChange={set('topSpeed')} /></div>
            <div><label className="label">Elev ft</label><input type="number" min="0" className="input" value={form.elevation} onChange={set('elevation')} /></div>
          </div>
        )}
        <div className="card-tight flex items-center justify-between">
          <span className="text-sm text-slate-400">Estimated burn</span>
          <span className="font-display text-xl font-bold text-volt-400 tabular-nums">{cal} cal</span>
        </div>
        <button className="btn-primary w-full" disabled={!valid} onClick={save}>
          Save skate
        </button>
      </div>
    </Modal>
  )
}
