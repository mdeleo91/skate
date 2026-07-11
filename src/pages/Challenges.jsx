import { useData } from '../context/DataContext'
import { WEEKLY_CHALLENGES, MONTHLY_CHALLENGES } from '../lib/achievements'
import { Card, SectionTitle, Bar } from '../components/ui'
import Icon from '../components/icons'

export default function Challenges() {
  const data = useData()
  if (!data) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Challenges</h1>
        <p className="text-sm text-slate-500 mt-1">
          Short targets that make the next skate feel like it matters. Join what you want. Ignore the rest.
        </p>
      </div>

      <section>
        <SectionTitle>Weekly</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {WEEKLY_CHALLENGES.map((c) => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>

      <section>
        <SectionTitle>Monthly</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {MONTHLY_CHALLENGES.map((c) => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>
    </div>
  )
}

function ChallengeCard({ c }) {
  const data = useData()
  const joined = data.challenges.joined.includes(c.id)
  const cur = data.d.metrics[c.metric] ?? 0
  const pct = Math.min(100, (cur / c.goal) * 100)
  const done = cur >= c.goal

  return (
    <Card className={done && joined ? 'border-volt-500/40 bg-volt-500/[0.04]' : ''}>
      <div className="flex items-start justify-between">
        <span className="text-volt-400"><Icon name={c.icon} size={26} /></span>
        <button
          onClick={() => data.toggleChallenge(c.id)}
          className={`chip !px-2.5 !py-1 ${joined ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400 hover:text-slate-200'}`}
        >
          {joined ? 'Joined' : 'Join'}
        </button>
      </div>
      <div className="font-display font-bold text-white mt-2">{c.name}</div>
      <div className="text-xs text-slate-400 mt-0.5">{c.desc}</div>
      <Bar value={cur} goal={c.goal} color={done ? 'bg-volt-500' : 'bg-surge-500'} className="mt-3" />
      <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
        {Math.round(cur * 10) / 10} / {c.goal} {c.unit}
        {done && <span className="text-volt-400 font-semibold ml-1.5">· Complete <Icon name="celebration" size={12} /></span>}
      </div>
    </Card>
  )
}
