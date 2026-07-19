import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Stat, Bar, Sparkline, EmptyState } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { isoDay, fmtDuration } from '../lib/calc'
import { SKATE_TYPES } from '../lib/skateTypes'
import { trailCoverage } from '../lib/trailMatch'
import Icon from '../components/icons'

export default function Progress() {
  const data = useData()

  const trailPcts = useMemo(() => {
    if (!data) return {}
    return Object.fromEntries((data.trails || []).map((t) => [t.id, trailCoverage(t, data.workouts).pct]))
  }, [data?.trails, data?.workouts])

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
      </div>
    )
  }

  const weekly = last8Weeks(data.workouts)
  const heat = heatmapWeeks(data.workouts)
  const speeds = data.workouts
    .filter((w) => w.kind === 'skate' && w.avgSpeed > 0 && w.source !== 'manual')
    .slice(0, 20).reverse()
  const speedTrend = speedDelta(speeds)
  const mix = disciplineMix(data.workouts)
  const totalElev = data.workouts.reduce((a, w) => a + (w.elevation || 0), 0)

  const prs = [
    { icon: 'straighten', label: 'Longest Skate', value: d.prs.longestDistance > 0 ? `${d.prs.longestDistance.toFixed(2)} mi` : '—' },
    { icon: 'bolt', label: 'Fastest Avg', value: d.prs.fastestAvg > 0 ? `${d.prs.fastestAvg.toFixed(1)} mph` : '—' },
    { icon: 'rocket_launch', label: 'Top Speed', value: d.prs.fastestTop > 0 ? `${d.prs.fastestTop.toFixed(1)} mph` : '—' },
    { icon: 'timer', label: 'Longest Session', value: d.prs.longestWorkout > 0 ? fmtDuration(d.prs.longestWorkout * 60) : '—' },
    { icon: 'local_fire_department', label: 'Most Calories', value: d.prs.mostCalories > 0 ? d.prs.mostCalories.toLocaleString() : '—' },
    { icon: 'calendar_month', label: 'Best Week', value: `${Math.max(...weekly.map((w) => w.miles), 0).toFixed(1)} mi` },
  ]

  const recentUnlocks = ACHIEVEMENTS.filter((a) => d.unlocked.includes(a.id)).slice(-4)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Your Progress</h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything your wheels have been telling you — worth a scroll after every week of skating.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="This Week" value={`${d.metrics.weekMiles.toFixed(1)} mi`} accent="text-volt-400" />
        <Stat label="This Month" value={`${d.metrics.monthMiles.toFixed(1)} mi`} />
        <Stat label="Streak" value={`${d.streak}d`} accent="text-ember-400" sub={`best ${d.bestStreak}d`} />
        <Stat label="Achievements" value={`${d.unlocked.length}/${ACHIEVEMENTS.length}`} />
      </div>

      {/* Every day of the last 12 weeks, colored by activity */}
      <Card>
        <SectionTitle>Activity Map</SectionTitle>
        <div className="flex gap-[3px] justify-between">
          {heat.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] flex-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${day.date}: ${day.minutes} min` : ''}
                  className="aspect-square w-full rounded-[3px]"
                  style={{ background: day == null ? 'transparent' : heatColor(day.minutes) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
          <span>12 weeks ago</span>
          <span className="flex items-center gap-1">
            less
            {[0, 15, 40, 70].map((m) => (
              <span key={m} className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: heatColor(m) }} />
            ))}
            more
          </span>
          <span>today</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>Weekly Miles</SectionTitle>
        <div className="flex items-end gap-1.5 h-32">
          {weekly.map((w) => {
            const max = Math.max(...weekly.map((x) => x.miles), 1)
            return (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-slate-400 tabular-nums">{w.miles > 0 ? w.miles.toFixed(0) : ''}</div>
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

      {/* Are you getting faster? */}
      {speeds.length >= 3 && (
        <Card>
          <SectionTitle>Avg Speed per Skate</SectionTitle>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tabular-nums text-white">
              {speeds[speeds.length - 1].avgSpeed.toFixed(1)}
            </span>
            <span className="text-sm text-slate-400">mph latest</span>
            {speedTrend != null && (
              <span className={`chip ml-auto ${speedTrend >= 0 ? 'bg-volt-500/15 text-volt-400' : 'bg-white/5 text-slate-400'}`}>
                {speedTrend >= 0 ? '▲' : '▼'} {Math.abs(speedTrend).toFixed(1)} mph vs your first skates
              </span>
            )}
          </div>
          <Sparkline data={speeds.map((w) => w.avgSpeed)} trend height={80} />
          <div className="text-xs text-slate-500">Last {speeds.length} GPS skates. Dashed line is the trend.</div>
        </Card>
      )}

      {/* What kind of skater you're becoming */}
      {mix.length > 0 && (
        <Card>
          <SectionTitle>Discipline Mix</SectionTitle>
          <div className="space-y-2.5">
            {mix.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className={`shrink-0 ${m.textColor}`}><Icon name={m.icon} size={18} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{m.label}</span>
                    <span className="tabular-nums text-slate-400">{(m.minutes / 60).toFixed(1)} h{m.miles > 0 ? ` · ${m.miles.toFixed(0)} mi` : ''}</span>
                  </div>
                  <Bar value={m.minutes} goal={mix[0].minutes} color={m.barColor} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Personal Records</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {prs.map((r) => (
            <div key={r.label} className="text-center">
              <span
                className="mx-auto grid h-12 w-12 place-items-center bg-volt-500/12 text-volt-400"
                style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}
              >
                <Icon name={r.icon} size={22} />
              </span>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1.5">{r.label}</div>
              <div className="font-display font-bold text-white tabular-nums text-sm mt-0.5">{r.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {(data.trails || []).length > 0 && (
        <Card>
          <SectionTitle action={<Link to="/trails" className="text-xs text-volt-400 font-semibold">All trails</Link>}>Trail Quests</SectionTitle>
          <div className="space-y-3">
            {data.trails.map((t) => (
              <Link key={t.id} to={`/trail/${t.id}`} className="block group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 truncate group-hover:text-volt-400 transition">{t.name}</span>
                  <span className="tabular-nums font-semibold text-white">{trailPcts[t.id]}%</span>
                </div>
                <Bar value={trailPcts[t.id]} goal={100} />
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Percent of each trail's mapped pavement you've covered.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Elevation Climbed" value={`${totalElev.toLocaleString()} ft`} sub="lifetime" />
        <Stat label="Hours Active" value={(d.totalMinutes / 60).toFixed(1)} sub="lifetime" />
        <Stat label="Sessions" value={data.workouts.length} sub="lifetime" />
        <Stat label="Calories Burned" value={d.totalCalories.toLocaleString()} accent="text-volt-400" sub="lifetime" />
      </div>

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

// 12 columns of weeks × 7 rows of days, ending today. Nulls pad the future.
function heatmapWeeks(workouts) {
  const byDay = {}
  for (const w of workouts) byDay[w.date] = (byDay[w.date] || 0) + (w.minutes || 0)
  const today = new Date()
  const weeks = []
  // Start from the Monday 11 weeks back
  const start = new Date(today)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 77)
  for (let wk = 0; wk < 12; wk++) {
    const days = []
    for (let dy = 0; dy < 7; dy++) {
      const dt = new Date(start)
      dt.setDate(start.getDate() + wk * 7 + dy)
      if (dt > today) { days.push(null); continue }
      const date = isoDay(dt)
      days.push({ date, minutes: Math.round(byDay[date] || 0) })
    }
    weeks.push(days)
  }
  return weeks
}

function heatColor(minutes) {
  if (minutes <= 0) return 'rgba(255,255,255,0.06)'
  if (minutes < 20) return 'rgba(45,212,191,0.25)'
  if (minutes < 45) return 'rgba(45,212,191,0.5)'
  if (minutes < 75) return 'rgba(45,212,191,0.75)'
  return 'rgba(45,212,191,1)'
}

// Recent-average avg speed vs the earliest recorded skates.
function speedDelta(speeds) {
  if (speeds.length < 6) return null
  const first = speeds.slice(0, 3).reduce((a, w) => a + w.avgSpeed, 0) / 3
  const last = speeds.slice(-3).reduce((a, w) => a + w.avgSpeed, 0) / 3
  return +(last - first).toFixed(1)
}

const MIX_TEXT = { volt: 'text-volt-400', surge: 'text-surge-400', ember: 'text-ember-400' }
const MIX_BAR = { volt: 'bg-volt-500', surge: 'bg-surge-500', ember: 'bg-ember-500' }

function disciplineMix(workouts) {
  const buckets = {}
  for (const w of workouts) {
    let key, label, icon, color
    if (w.kind !== 'skate') {
      key = w.kind === 'strength' ? 'strength' : 'recovery-x'
      label = w.kind === 'strength' ? 'Strength' : 'Recovery Work'
      icon = w.kind === 'strength' ? 'fitness_center' : 'eco'
      color = 'surge'
    } else {
      const t = SKATE_TYPES.find((x) => x.id === w.typeId) || SKATE_TYPES[0]
      key = t.id
      label = t.name
      icon = t.icon
      color = t.color
    }
    const b = (buckets[key] ??= { label, icon, minutes: 0, miles: 0, color })
    b.minutes += w.minutes || 0
    b.miles += w.miles || 0
  }
  return Object.values(buckets)
    .filter((b) => b.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6)
    .map((b) => ({ ...b, textColor: MIX_TEXT[b.color] || 'text-slate-300', barColor: MIX_BAR[b.color] || 'bg-slate-500' }))
}
