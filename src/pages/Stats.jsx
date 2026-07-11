import { useData } from '../context/DataContext'
import { Card, Stat, SectionTitle } from '../components/ui'
import { fmtDuration, fmtPace } from '../lib/calc'

export default function Stats() {
  const data = useData()
  if (!data) return null
  const { d } = data

  const lifetime = [
    ['Total Miles', d.totalMiles.toFixed(1)],
    ['Total Hours', (d.totalMinutes / 60).toFixed(1)],
    ['Total Calories', d.totalCalories.toLocaleString()],
    ['Total Workouts', data.workouts.length],
    ['Longest Skate', `${d.prs.longestDistance.toFixed(1)} mi`],
    ['Fastest Speed', `${d.prs.fastestTop.toFixed(1)} mph`],
    ['Average Pace', fmtPace(d.totalMinutes, d.totalMiles)],
    ['Active Days', d.metrics.daysActive],
    ['Current Streak', `${d.streak}d`],
    ['Longest Streak', `${d.bestStreak}d`],
  ]

  const records = [
    { label: 'Longest Distance', value: `${d.prs.longestDistance.toFixed(2)} mi`, emoji: '📏' },
    { label: 'Fastest Avg Speed', value: `${d.prs.fastestAvg.toFixed(1)} mph`, emoji: '⚡' },
    { label: 'Fastest Top Speed', value: `${d.prs.fastestTop.toFixed(1)} mph`, emoji: '🚀' },
    { label: 'Longest Workout', value: fmtDuration(d.prs.longestWorkout * 60), emoji: '⏱' },
    { label: 'Most Calories Burned', value: `${d.prs.mostCalories.toLocaleString()} cal`, emoji: '🔥' },
    { label: 'Longest Active Streak', value: `${d.prs.longestStreak} days`, emoji: '📅' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Lifetime Stats</h1>
        <p className="text-sm text-slate-500 mt-1">Everything you've done on wheels, added up.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {lifetime.map(([l, v]) => <Stat key={l} label={l} value={v} />)}
      </div>

      <section>
        <SectionTitle>🏆 Personal Records</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {records.map((r) => (
            <Card key={r.label} className="flex items-center gap-3">
              <span className="text-2xl">{r.emoji}</span>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">{r.label}</div>
                <div className="font-display text-xl font-bold text-white tabular-nums">{r.value}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <SectionTitle>Progress System</SectionTitle>
        <p className="text-sm text-slate-400 mb-3">
          Your journey isn't one number. It's seven of them, and they all move at their own pace.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Miles Skated', d.totalMiles.toFixed(0)],
            ['Workouts', data.workouts.length],
            ['Calories Burned', d.totalCalories.toLocaleString()],
            ['Weight Lost', `${d.lbsLost.toFixed(1)} lb`],
            ['Time Active', `${(d.totalMinutes / 60).toFixed(0)} h`],
            ['Current Streak', `${d.streak}d`],
            ['Programs Done', d.metrics.programsCompleted],
            ['Achievements', d.unlocked.length],
          ].map(([l, v]) => (
            <div key={l} className="card-tight">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
              <div className="font-display text-xl font-bold text-volt-400 tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
