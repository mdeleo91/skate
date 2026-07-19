import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SKATE_TYPES } from '../lib/skateTypes'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Modal } from '../components/ui'
import Icon from '../components/icons'
import LogSkateModal from '../components/LogSkateModal'
import RecentActivity from '../components/RecentActivity'
import { trailCoverage } from '../lib/trailMatch'
import { todayISO } from '../lib/calc'

const RING = { volt: 'hover:border-volt-500/50', surge: 'hover:border-surge-500/50', ember: 'hover:border-ember-500/50' }
const TEXT = { volt: 'text-volt-400', surge: 'text-surge-400', ember: 'text-ember-400' }

export default function SkateStart() {
  const nav = useNavigate()
  const data = useData()
  const [selected, setSelected] = useState(null)
  const [manualTypeId, setManualTypeId] = useState(null)
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
              <span className={TEXT[t.color]}><Icon name={t.icon} size={28} /></span>
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

      <TrailsSection trails={data.trails || []} workouts={data.workouts} />

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <SectionTitle>Not skating today?</SectionTitle>
          <p className="text-sm text-slate-400 mb-3">
            Strength and recovery days build skaters too. They count toward your streak.
          </p>
          <button onClick={() => setStrength(true)} className="btn-ghost w-full">
            <Icon name="fitness_center" size={18} /> Log a strength session
          </button>
        </Card>
        <Card>
          <SectionTitle>Already skated?</SectionTitle>
          <p className="text-sm text-slate-400 mb-3">
            Forgot to hit start? Enter it manually — no session is wasted.
          </p>
          <button onClick={() => setManualTypeId(SKATE_TYPES[0].id)} className="btn-ghost w-full">
            <Icon name="edit" size={18} /> Log a past skate
          </button>
        </Card>
      </div>

      <RecentActivity />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? <><Icon name={selected.icon} size={20} className={`mr-1.5 ${TEXT[selected.color]}`} />{selected.name}</> : ''}
      >
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
            <button className="btn-ghost w-full" onClick={() => { setManualTypeId(selected.id); setSelected(null) }}>
              Enter manually instead
            </button>
          </div>
        )}
      </Modal>

      <LogSkateModal
        open={!!manualTypeId}
        initialTypeId={manualTypeId}
        onClose={() => setManualTypeId(null)}
        onSaved={() => nav('/history')}
      />
      <StrengthModal open={strength} onClose={() => setStrength(false)} />
    </div>
  )
}

// The trail hub on the Skate tab: saved trails with live completion bars, or
// the discovery banner until the first one is saved.
function TrailsSection({ trails, workouts }) {
  const coverage = useMemo(
    () => Object.fromEntries(trails.map((t) => [t.id, trailCoverage(t, workouts).pct])),
    [trails, workouts]
  )

  if (trails.length === 0) {
    return (
      <Link to="/trails" className="card flex items-center gap-3 hover:border-volt-500/40 transition group">
        <span className="shrink-0 text-volt-400"><Icon name="travel_explore" size={26} /></span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-white group-hover:text-volt-400 transition">Find trails nearby</div>
          <div className="text-xs text-slate-400 mt-0.5">Paved paths and rail trails around you, from OpenStreetMap</div>
        </div>
        <Icon name="arrow_forward" size={18} className="text-slate-500 shrink-0" />
      </Link>
    )
  }

  return (
    <div>
      <SectionTitle action={<Link to="/trails" className="text-xs text-volt-400 font-semibold">Find more</Link>}>
        Your Trails
      </SectionTitle>
      <div className="space-y-2">
        {trails.map((t) => (
          <Link key={t.id} to={`/trail/${t.id}`} className="card !py-3 flex items-center gap-3 hover:border-volt-500/40 transition group">
            <span className="shrink-0 text-volt-400"><Icon name="route" size={22} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-white truncate group-hover:text-volt-400 transition">{t.name}</div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-volt-500" style={{ width: `${coverage[t.id]}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                {coverage[t.id]}% skated · ~{(t.lengthM / 1609.344).toFixed(1)} mi
              </div>
            </div>
            <Icon name="arrow_forward" size={16} className="text-slate-500 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
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
            <option value="strength">Strength</option>
            <option value="recovery">Recovery / mobility</option>
          </select>
        </div>
        <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date</label><input type="date" max={todayISO()} className="input" value={form.date} onChange={set('date')} /></div>
          <div><label className="label">Minutes</label><input type="number" min="1" className="input" value={form.minutes} onChange={set('minutes')} /></div>
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
