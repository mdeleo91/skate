import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Bar, Modal, EmptyState } from '../components/ui'
import Icon from '../components/icons'
import { todayISO } from '../lib/calc'

const CATS = ['Boots', 'Frames', 'Wheels', 'Bearings', 'Protective Gear']
const CAT_ICON = { Boots: 'footprint', Frames: 'construction', Wheels: 'tire_repair', Bearings: 'settings', 'Protective Gear': 'health_and_safety' }

export default function Gear() {
  const data = useData()
  const [add, setAdd] = useState(false)
  const [maint, setMaint] = useState(null)
  if (!data) return null

  const gear = data.d.gear
  const wheels = gear.filter((g) => g.cat === 'Wheels')
  const bearings = gear.filter((g) => g.cat === 'Bearings')

  if (!gear.length) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="h-title">Gear Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Mileage logs itself from your skates. Worn wheels are slow wheels.</p>
        </div>
        <EmptyState
          icon="roller_skating"
          title="Add your first pair of skates"
          desc="Tell Skate what you roll on and it quietly counts the miles for you — boots, frames, wheels, bearings and pads — then tells you when the wheels are due for a rotation or a replacement."
          cta="Add gear"
          onClick={() => setAdd(true)}
          hint="Nothing to configure. Mileage accrues from the skates you log."
        />
        <Card>
          <SectionTitle>What you can track</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {CATS.map((c) => (
              <div key={c} className="card-tight !p-3">
                <div className="text-slate-300"><Icon name={CAT_ICON[c]} size={22} /></div>
                <div className="text-xs text-slate-400 mt-1">{c}</div>
              </div>
            ))}
          </div>
        </Card>
        <AddGear open={add} onClose={() => setAdd(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="h-title">Gear Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Mileage logs itself from your skates. Worn wheels are slow wheels.</p>
        </div>
        <button onClick={() => setAdd(true)} className="btn-primary !px-4 shrink-0">+ Add</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <SectionTitle><Icon name="tire_repair" size={15} className="mr-1.5" />Wheel Mileage</SectionTitle>
          {wheels.length ? wheels.map((w) => (
            <div key={w.id} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-200">{w.name}</span>
                <span className="tabular-nums text-slate-400">{w.miles} / {w.lifeMiles} mi</span>
              </div>
              <Bar value={w.miles} goal={w.lifeMiles} color={w.pct > 85 ? 'bg-ember-500' : 'bg-volt-500'} />
              <div className={`text-xs mt-1 ${w.pct > 85 ? 'text-ember-400' : 'text-slate-500'}`}>
                {w.pct > 85
                  ? `Estimated replacement due — ~${Math.round(w.remaining)} mi left`
                  : `~${Math.round(w.remaining)} mi until replacement`}
              </div>
            </div>
          )) : <div className="text-sm text-slate-500">No wheels tracked.</div>}
        </Card>

        <Card>
          <SectionTitle><Icon name="settings" size={15} className="mr-1.5" />Bearing Mileage</SectionTitle>
          {bearings.length ? bearings.map((b) => (
            <div key={b.id} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-200">{b.name}</span>
                <span className="tabular-nums text-slate-400">{b.miles} / {b.lifeMiles} mi</span>
              </div>
              <Bar value={b.miles} goal={b.lifeMiles} color="bg-surge-500" />
              <div className="text-xs text-slate-500 mt-1">Clean and re-lube every ~100 mi in wet conditions.</div>
            </div>
          )) : <div className="text-sm text-slate-500">No bearings tracked.</div>}
        </Card>
      </div>

      {CATS.map((cat) => {
        const items = gear.filter((g) => g.cat === cat)
        if (!items.length) return null
        return (
          <Card key={cat}>
            <SectionTitle><Icon name={CAT_ICON[cat]} size={15} className="mr-1.5" />{cat}</SectionTitle>
            <div className="space-y-3">
              {items.map((g) => (
                <div key={g.id} className="card-tight">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">{g.name}</div>
                      <div className="text-xs text-slate-500">In service since {g.purchased || '—'}{g.notes ? ` · ${g.notes}` : ''}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-bold tabular-nums text-white">{g.miles}<span className="text-xs text-slate-500 ml-0.5">mi</span></div>
                      <div className="text-[10px] text-slate-500">{g.pct}% of life</div>
                    </div>
                  </div>
                  <Bar value={g.miles} goal={g.lifeMiles} color={g.pct > 85 ? 'bg-ember-500' : 'bg-volt-500'} className="mt-2" />
                  {g.maintenance?.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      {g.maintenance.slice(0, 3).map((m, i) => <div key={i}><Icon name="build" size={12} className="mr-1" />{m.date} — {m.note}</div>)}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setMaint(g)} className="btn-ghost !py-1 !px-2.5 text-xs">Log maintenance</button>
                    <button onClick={() => data.resetGearMileage(g.id)} className="btn-ghost !py-1 !px-2.5 text-xs">Rotate / reset</button>
                    <button onClick={() => data.deleteGear(g.id)} className="btn-ghost !py-1 !px-2.5 text-xs !text-ember-400">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <AddGear open={add} onClose={() => setAdd(false)} />
      <MaintModal gear={maint} onClose={() => setMaint(null)} />
    </div>
  )
}

function AddGear({ open, onClose }) {
  const data = useData()
  const [f, setF] = useState({ cat: 'Wheels', name: '', lifeMiles: 400, purchased: todayISO(), notes: '' })
  if (!open) return null
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  return (
    <Modal open onClose={onClose} title="Add gear">
      <div className="space-y-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={f.cat} onChange={set('cat')}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="label">Name</label><input className="input" placeholder="Matter Juice 110mm" value={f.name} onChange={set('name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Expected life (mi)</label><input type="number" className="input" value={f.lifeMiles} onChange={set('lifeMiles')} /></div>
          <div><label className="label">In service since</label><input type="date" className="input" value={f.purchased} onChange={set('purchased')} /></div>
        </div>
        <div><label className="label">Notes</label><input className="input" value={f.notes} onChange={set('notes')} /></div>
        <button
          className="btn-primary w-full" disabled={!f.name}
          onClick={() => { data.addGear({ ...f, lifeMiles: +f.lifeMiles }); onClose() }}
        >
          Add gear
        </button>
      </div>
    </Modal>
  )
}

function MaintModal({ gear, onClose }) {
  const data = useData()
  const [note, setNote] = useState('')
  if (!gear) return null
  return (
    <Modal open onClose={onClose} title={<><Icon name="build" size={18} className="mr-1.5 text-volt-400" />{gear.name}</>}>
      <div className="space-y-3">
        <div><label className="label">What did you do?</label><input className="input" placeholder="Rotated wheels / cleaned bearings" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <button className="btn-primary w-full" disabled={!note} onClick={() => { data.logMaintenance(gear.id, note); onClose() }}>
          Log it
        </button>
        {gear.maintenance?.length > 0 && (
          <div className="card-tight">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Maintenance History</div>
            {gear.maintenance.map((m, i) => (
              <div key={i} className="text-sm text-slate-300 py-0.5">{m.date} — {m.note}</div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
