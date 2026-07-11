import { useState } from 'react'
import { useData } from '../context/DataContext'
import { PROGRAMS } from '../lib/programs'
import { Card, SectionTitle, Bar, Modal } from '../components/ui'

export default function Programs() {
  const data = useData()
  const [open, setOpen] = useState(null)
  if (!data) return null
  const { program } = data
  const active = PROGRAMS.find((p) => p.id === program.activeId)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Guided Programs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Skating plus strength plus recovery, in an order that makes sense. Structure beats motivation.
        </p>
      </div>

      {active && <ActivePlan program={active} />}

      <div className="grid sm:grid-cols-2 gap-3">
        {PROGRAMS.map((p) => {
          const done = program.completed.includes(p.id)
          const isActive = program.activeId === p.id
          return (
            <button key={p.id} onClick={() => setOpen(p)} className={`card text-left transition hover:border-volt-500/40 ${isActive ? 'border-volt-500/50 bg-volt-500/[0.04]' : ''}`}>
              <div className="flex items-start justify-between">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex gap-1">
                  {done && <span className="chip bg-volt-500/15 text-volt-400">Completed</span>}
                  {isActive && <span className="chip bg-surge-500/15 text-surge-400">Active</span>}
                </div>
              </div>
              <div className="font-display font-bold text-white mt-2">{p.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{p.tagline}</div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                <span className="chip bg-ink-700 text-slate-400">{p.weeks} weeks</span>
                <span className="chip bg-ink-700 text-slate-400">{p.level}</span>
                {p.focus.map((f) => <span key={f} className="chip bg-ink-700 text-slate-400">{f}</span>)}
              </div>
            </button>
          )
        })}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.emoji} ${open.name}` : ''}>
        {open && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{open.summary}</p>
            <div className="flex gap-1.5 flex-wrap">
              <span className="chip bg-ink-700 text-slate-300">{open.weeks} weeks</span>
              <span className="chip bg-ink-700 text-slate-300">{open.level}</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {open.plan.map((w) => (
                <div key={w.n} className="card-tight">
                  <div className="text-xs font-semibold text-volt-400 uppercase tracking-wider">Week {w.n} · {w.title}</div>
                  <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                    {w.days.map((d, i) => <div key={i}>Day {i + 1} — {d}</div>)}
                  </div>
                </div>
              ))}
              {open.weeks > open.plan.length && (
                <p className="text-xs text-slate-500 px-1">
                  Showing the first {open.plan.length} weeks. The remaining weeks repeat this build/deload
                  rhythm with rising volume.
                </p>
              )}
            </div>
            {data.program.activeId === open.id ? (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={() => { data.leaveProgram(); setOpen(null) }}>Leave program</button>
                <button className="btn-primary" onClick={() => { data.completeProgram(open.id); setOpen(null) }}>Mark complete</button>
              </div>
            ) : (
              <button className="btn-primary w-full" onClick={() => { data.startProgram(open.id); setOpen(null) }}>
                Start this program
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function ActivePlan({ program }) {
  const data = useData()
  const done = data.program.doneDays
  const totalDays = program.plan.reduce((a, w) => a + w.days.length, 0)

  return (
    <Card className="border-volt-500/30 bg-volt-500/[0.03]">
      <SectionTitle action={<span className="chip bg-volt-500/15 text-volt-400">Active</span>}>
        {program.emoji} {program.name}
      </SectionTitle>
      <p className="text-sm text-slate-300 mb-3">{program.tagline}</p>
      <Bar value={done.length} goal={totalDays} />
      <div className="text-xs text-slate-500 mt-1.5 mb-4">{done.length} of {totalDays} shown sessions complete</div>

      <div className="space-y-3">
        {program.plan.map((w) => (
          <div key={w.n}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Week {w.n} · {w.title}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {w.days.map((d, i) => {
                const key = `${program.id}-w${w.n}-d${i}`
                const checked = done.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => data.toggleProgramDay(key)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      checked ? 'bg-volt-500/10 text-slate-300 line-through' : 'bg-ink-700 text-slate-200 hover:bg-ink-600'
                    }`}
                  >
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] ${
                      checked ? 'bg-volt-500 border-volt-500 text-ink-900' : 'border-white/20'
                    }`}>{checked ? '✓' : ''}</span>
                    <span className="truncate">{d}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
