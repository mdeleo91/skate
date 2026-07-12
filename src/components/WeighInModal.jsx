import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Modal } from './ui'
import { todayISO } from '../lib/calc'

// One number, one tap. Weight only — the trend line does the rest.
export default function WeighInModal({ open, onClose }) {
  if (!open) return null
  return <WeighInForm onClose={onClose} />
}

function WeighInForm({ onClose }) {
  const data = useData()
  const [date, setDate] = useState(todayISO())
  const [weightLb, setWeightLb] = useState('')
  const valid = +weightLb > 0

  return (
    <Modal open onClose={onClose} title="Log a weigh-in">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" max={todayISO()} className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (lb)</label>
            <input
              type="number" step="0.1" min="1" className="input" autoFocus
              placeholder={data.d.currentWeight ? String(data.d.currentWeight) : '175'}
              value={weightLb}
              onChange={(e) => setWeightLb(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && valid) { data.addWeight({ date, weightLb: +weightLb }); onClose() } }}
            />
          </div>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!valid}
          onClick={() => { data.addWeight({ date, weightLb: +weightLb }); onClose() }}
        >
          Save weigh-in
        </button>
        <p className="text-xs text-slate-500 text-center">Weigh in weekly, same time of day. Daily is noise.</p>
      </div>
    </Modal>
  )
}
