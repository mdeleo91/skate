import { useState } from 'react'
import { useData } from '../context/DataContext'
import { ACHIEVEMENTS, ACHIEVEMENT_CATS } from '../lib/achievements'
import { Card, Bar, SectionTitle } from '../components/ui'

export default function Achievements() {
  const data = useData()
  const [cat, setCat] = useState('All')
  if (!data) return null
  const { d } = data

  const list = ACHIEVEMENTS.filter((a) => cat === 'All' || a.cat === cat)
  const unlockedCount = d.unlocked.length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Achievements</h1>
        <p className="text-sm text-slate-500 mt-1">
          {unlockedCount} of {ACHIEVEMENTS.length} unlocked. Each one is a thing you actually did.
        </p>
      </div>

      <Card>
        <Bar value={unlockedCount} goal={ACHIEVEMENTS.length} />
        <div className="text-xs text-slate-500 mt-1.5">{Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% complete</div>
      </Card>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {['All', ...ACHIEVEMENT_CATS].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`chip whitespace-nowrap !px-3 !py-1.5 ${cat === c ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((a) => {
          const cur = d.metrics[a.metric] ?? 0
          const unlocked = d.unlocked.includes(a.id)
          const pct = Math.min(100, (cur / a.goal) * 100)
          return (
            <Card key={a.id} className={unlocked ? 'border-volt-500/40 bg-volt-500/[0.04]' : ''}>
              <div className="flex items-start gap-3">
                <span className={`text-3xl ${unlocked ? '' : 'grayscale opacity-40'}`}>{a.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-bold ${unlocked ? 'text-volt-400' : 'text-slate-200'}`}>{a.name}</span>
                    {unlocked && <span className="chip bg-volt-500/15 text-volt-400">Unlocked</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
                  {!unlocked && (
                    <>
                      <Bar value={cur} goal={a.goal} color="bg-surge-500" className="mt-2" />
                      <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                        {Math.round(cur * 10) / 10} / {a.goal} · {Math.round(pct)}%
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
