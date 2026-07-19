import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Stat, Bar, Sparkline, EmptyState } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { isoDay } from '../lib/calc'
import Icon from '../components/icons'

export default function Progress() {
  const data = useData()
  if (!data) return null
  const { d } = data

  if (d.isBrandNew) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="h-title">Your Progress</h1>
          <p className="text-sm text-slate-500 mt-1">Seven measures of a fitness journey — none of them "did you lose weight today?"</p>
        </div>
        <EmptyState
          icon="monitoring"
          title="This fills in as you go"
          desc="Miles skated, workouts completed, calories burned, weight lost, time active, streaks and programs finished. Seven lines that all start at zero and only move one way."
          cta="Start a Skate"
          to="/skate"
        />
        <Card>
          <SectionTitle>The seven measures</SectionTitle>
          <div className="space-y-3">
            {['Miles Skated', 'Workouts Completed', 'Calories Burned', 'Weight Lost', 'Time Active', 'Current Streak', 'Programs Completed'].map((label) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="tabular-nums text-slate-600">—</span>
                </div>
                <Bar value={0} goal={100} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const weekly = last8Weeks(data.workouts)
  const pillars = [
    { label: 'Miles Skated', value: d.totalMiles.toFixed(1), goal: 500, cur: d.totalMiles, color: 'bg-volt-500' },
    { label: 'Workouts Completed', value: data.workouts.length, goal: 100, cur: data.workouts.length, color: 'bg-surge-500' },
    { label: 'Calories Burned', value: d.totalCalories.toLocaleString(), goal: 10000, cur: d.totalCalories, color: 'bg-ember-500' },
    { label: 'Weight Lost', value: d.hasWeights ? `${d.lbsLost.toFixed(1)} lb` : '—', goal: Math.max(1, (d.startWeight ?? 0) - (data.profile.goalWeightLb ?? 0)) || 10, cur: d.lbsLost, color: 'bg-volt-500' },
    { label: 'Time Active', value: `${(d.totalMinutes / 60).toFixed(1)} h`, goal: 100, cur: d.totalMinutes / 60, color: 'bg-surge-500' },
    { label: 'Current Streak', value: `${d.streak} days`, goal: 30, cur: d.streak, color: 'bg-ember-500' },
    { label: 'Programs Completed', value: d.metrics.programsCompleted, goal: 3, cur: d.metrics.programsCompleted, color: 'bg-volt-500' },
  ]

  const recentUnlocks = ACHIEVEMENTS.filter((a) => d.unlocked.includes(a.id)).slice(-4)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Your Progress</h1>
        <p className="text-sm text-slate-500 mt-1">
          Seven measures of a fitness journey. None of them is "did you lose weight today?"
        </p>
      </div>

      <Card>
        <SectionTitle>Weekly Miles</SectionTitle>
        <div className="flex items-end gap-1.5 h-32">
          {weekly.map((w) => {
            const max = Math.max(...weekly.map((x) => x.miles), 1)
            return (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-volt-600 to-volt-400 transition-all"
                    style={{ height: `${(w.miles / max) * 100}%`, minHeight: w.miles > 0 ? '4px' : '0' }}
                    title={`${w.miles.toFixed(1)} mi`}
                  />
                </div>
                <div className="text-[10px] text-slate-500">{w.label}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="This Week" value={`${d.metrics.weekMiles.toFixed(1)} mi`} accent="text-volt-400" />
        <Stat label="This Month" value={`${d.metrics.monthMiles.toFixed(1)} mi`} />
        <Stat label="Streak" value={`${d.streak}d`} accent="text-ember-400" />
        <Stat label="Achievements" value={`${d.unlocked.length}/${ACHIEVEMENTS.length}`} />
      </div>

      <Card>
        <SectionTitle>Progress System</SectionTitle>
        <div className="space-y-3.5">
          {pillars.map((p) => (
            <div key={p.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{p.label}</span>
                <span className="tabular-nums font-semibold text-white">{p.value}</span>
              </div>
              <Bar value={p.cur} goal={p.goal} color={p.color} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <SectionTitle action={<Link to="/weight" className="text-xs text-volt-400 font-semibold">Details</Link>}>Weight Trend</SectionTitle>
          <Sparkline data={d.weights.slice(-12).map((w) => w.weightLb)} trend height={90} />
        </Card>
        <Card>
          <SectionTitle action={<Link to="/achievements" className="text-xs text-volt-400 font-semibold">All</Link>}>Recent Unlocks</SectionTitle>
          {recentUnlocks.length ? (
            <div className="space-y-2">
              {recentUnlocks.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <span className="text-volt-400"><Icon name={a.icon} size={22} /></span>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.cat}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-slate-500">Nothing unlocked yet. The first mile is waiting.</div>}
        </Card>
      </div>
    </div>
  )
}

function last8Weeks(workouts) {
  const out = []
  for (let i = 7; i >= 0; i--) {
    const end = new Date()
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const s = isoDay(start)
    const e = isoDay(end)
    const miles = workouts.filter((w) => w.date >= s && w.date <= e && w.kind === 'skate').reduce((a, w) => a + (w.miles || 0), 0)
    out.push({ label: i === 0 ? 'Now' : `-${i}w`, miles })
  }
  return out
}
