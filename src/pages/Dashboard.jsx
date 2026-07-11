import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, Stat, Bar, Ring, Sparkline, SectionTitle } from '../components/ui'
import { fmtDuration } from '../lib/calc'
import { ACHIEVEMENTS } from '../lib/achievements'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const data = useData()
  if (!data) return null
  const { d, profile, addWater } = data

  const dailyMilesGoal = 3
  const weightSeries = d.weights.slice(-12).map((w) => w.weightLb)

  const nextGoal = ACHIEVEMENTS
    .filter((a) => !d.unlocked.includes(a.id))
    .map((a) => ({ ...a, cur: d.metrics[a.metric] ?? 0, pct: Math.min(100, ((d.metrics[a.metric] ?? 0) / a.goal) * 100) }))
    .sort((a, b) => b.pct - a.pct)[0]

  const movedToday = d.activeMinutesToday > 0

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm text-slate-400">{greeting()}, {profile.name}</div>
        <h1 className="h-title mt-0.5">
          {movedToday ? 'You got out there today. 🛼' : 'Ready to roll?'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {movedToday
            ? `${d.activeMinutesToday} active minutes logged. That's the whole ask.`
            : 'Even 15 easy minutes keeps the streak alive.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="col-span-2 sm:col-span-2 flex items-center gap-4">
          <Ring
            value={Math.max(0, d.budget.target - d.remaining)}
            goal={d.budget.target}
            label={d.remaining.toLocaleString()}
            sub="cal remaining"
          />
          <div className="flex-1 space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Base goal</span><span className="tabular-nums font-semibold">{d.budget.target.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Consumed</span><span className="tabular-nums font-semibold text-ember-400">−{d.consumed.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Burned</span><span className="tabular-nums font-semibold text-volt-400">+{d.burned.toLocaleString()}</span></div>
            <Link to="/nutrition" className="btn-ghost w-full !py-1.5 text-xs mt-1">Log food</Link>
          </div>
        </Card>

        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today's Skate</div>
          <div className="metric mt-1 text-volt-400">{d.milesToday.toFixed(1)}<span className="text-base text-slate-500 ml-1">mi</span></div>
          <Bar value={d.milesToday} goal={dailyMilesGoal} className="mt-2" />
          <div className="text-xs text-slate-500 mt-1.5">{dailyMilesGoal} mi daily target</div>
        </Card>

        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Water</div>
          <div className="metric mt-1 text-surge-400">{d.waterToday}<span className="text-base text-slate-500 ml-1">oz</span></div>
          <Bar value={d.waterToday} goal={profile.waterGoalOz} color="bg-surge-500" className="mt-2" />
          <div className="mt-2 flex gap-1.5">
            {[8, 16].map((oz) => (
              <button key={oz} onClick={() => addWater(oz)} className="btn-ghost flex-1 !py-1 !px-2 text-xs">+{oz}oz</button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Calories Consumed" value={d.consumed.toLocaleString()} sub={`${d.macrosToday.protein}g protein`} />
        <Stat label="Calories Burned" value={d.burned.toLocaleString()} accent="text-volt-400" sub="from activity today" />
        <Stat label="Active Minutes" value={d.activeMinutesToday} sub="today" />
        <Stat label="Current Streak" value={`${d.streak}d`} accent="text-ember-400" sub={`best: ${d.bestStreak}d`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <SectionTitle action={<Link to="/weight" className="text-xs text-volt-400 font-semibold">Details</Link>}>Weight Trend</SectionTitle>
          <div className="flex items-baseline gap-2">
            <div className="metric">{d.currentWeight.toFixed(1)}<span className="text-base text-slate-500 ml-1">lb</span></div>
            <span className={`chip ${d.lbsLost > 0 ? 'bg-volt-500/15 text-volt-400' : 'bg-white/5 text-slate-400'}`}>
              {d.lbsLost > 0 ? `↓ ${d.lbsLost.toFixed(1)} lb` : 'tracking'}
            </span>
          </div>
          <Sparkline data={weightSeries} color="#A3F015" trend height={72} />
          <div className="text-xs text-slate-500">
            Dashed line is the trend. Daily wobble is water, not fat.
          </div>
        </Card>

        <Card>
          <SectionTitle action={<Link to="/achievements" className="text-xs text-volt-400 font-semibold">All</Link>}>Next Goal</SectionTitle>
          {nextGoal ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{nextGoal.emoji}</span>
                <div>
                  <div className="font-display font-bold text-white">{nextGoal.name}</div>
                  <div className="text-xs text-slate-400">{nextGoal.desc}</div>
                </div>
              </div>
              <Bar value={nextGoal.cur} goal={nextGoal.goal} className="mt-3" color="bg-surge-500" />
              <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                {Math.round(nextGoal.cur * 10) / 10} / {nextGoal.goal} — {Math.round(nextGoal.pct)}% there
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Every achievement unlocked. Genuinely remarkable.</div>
          )}
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/skate" className="card hover:border-volt-500/40 transition group">
          <div className="text-2xl">🛼</div>
          <div className="font-display font-bold text-white mt-1.5 group-hover:text-volt-400 transition">Start a Skate</div>
          <div className="text-xs text-slate-400 mt-0.5">Pick a discipline and go</div>
        </Link>
        <Link to="/programs" className="card hover:border-volt-500/40 transition group">
          <div className="text-2xl">{d.activeProgram ? d.activeProgram.emoji : '🗺️'}</div>
          <div className="font-display font-bold text-white mt-1.5 group-hover:text-volt-400 transition">
            {d.activeProgram ? d.activeProgram.name : 'Join a Program'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {d.activeProgram ? `${data.program.doneDays.length} sessions done` : 'Structure beats motivation'}
          </div>
        </Link>
        <Link to="/weather" className="card hover:border-volt-500/40 transition group">
          <div className="text-2xl">🌤️</div>
          <div className="font-display font-bold text-white mt-1.5 group-hover:text-volt-400 transition">Skate Conditions</div>
          <div className="text-xs text-slate-400 mt-0.5">Is it a good day to skate?</div>
        </Link>
      </div>

      <Card>
        <SectionTitle action={<Link to="/history" className="text-xs text-volt-400 font-semibold">History</Link>}>Recent Activity</SectionTitle>
        <div className="divide-y divide-white/5">
          {data.workouts.slice(0, 4).map((w) => (
            <div key={w.id} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-700 text-base">
                {w.kind === 'strength' ? '💪' : '🛼'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-100 truncate">{w.name}</div>
                <div className="text-xs text-slate-500">{w.date} · {fmtDuration(w.minutes * 60)}{w.miles ? ` · ${w.miles.toFixed(1)} mi` : ''}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums text-volt-400">{w.calories} cal</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
