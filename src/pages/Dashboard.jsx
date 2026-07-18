import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Icon from '../components/icons'
import WeighInModal from '../components/WeighInModal'
import { Card, Stat, Bar, Ring, Sparkline, SectionTitle } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { useWeather, scoreConditions } from '../lib/weather'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const data = useData()
  const [weighIn, setWeighIn] = useState(false)
  if (!data) return null
  const { d, profile, addWater } = data

  if (d.isBrandNew) return <FirstRun name={profile.name} />

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
          {movedToday ? <>You got out there today. <Icon name="roller_skating" size={24} className="text-volt-400" /></> : 'Ready to roll?'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {movedToday
            ? `${d.activeMinutesToday} active minutes logged. That's the whole ask.`
            : 'Even 15 easy minutes keeps the streak alive.'}
        </p>
      </div>

      <ConditionsBanner />

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
          <SectionTitle
            action={(
              <span className="flex items-center gap-3">
                <button onClick={() => setWeighIn(true)} className="text-xs text-volt-400 font-semibold">+ Weigh in</button>
                <Link to="/weight" className="text-xs text-volt-400 font-semibold">Details</Link>
              </span>
            )}
          >Weight Trend</SectionTitle>
          {d.hasWeights ? (
            <>
              <div className="flex items-baseline gap-2">
                <div className="metric">{d.currentWeight.toFixed(1)}<span className="text-base text-slate-500 ml-1">lb</span></div>
                <span className={`chip ${d.lbsLost > 0 ? 'bg-volt-500/15 text-volt-400' : 'bg-white/5 text-slate-400'}`}>
                  {d.lbsLost > 0 ? <><Icon name="arrow_downward" size={12} /> {d.lbsLost.toFixed(1)} lb</> : 'tracking'}
                </span>
              </div>
              {d.weights.length >= 2 ? (
                <>
                  <Sparkline data={weightSeries} color="#2DD4BF" trend height={72} />
                  <div className="text-xs text-slate-500">
                    Dashed line is the trend. Daily wobble is water, not fat.
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 mt-3">
                  One more weigh-in and a trend line appears here. Weekly beats daily — no rush.
                </div>
              )}
            </>
          ) : (
            <div className="py-1">
              <div className="text-sm text-slate-400">
                No weigh-ins yet. Log a starting weight whenever you're ready — the trend matters far
                more than the first number.
              </div>
              <button onClick={() => setWeighIn(true)} className="btn-ghost mt-3 !py-1.5 text-xs inline-flex">Log starting weight</button>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle action={<Link to="/achievements" className="text-xs text-volt-400 font-semibold">All</Link>}>Next Goal</SectionTitle>
          {nextGoal ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-volt-400"><Icon name={nextGoal.icon} size={32} /></span>
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
            <div className="text-sm text-slate-400">Every achievement unlocked. Remarkable.</div>
          )}
        </Card>
      </div>

      <WeighInModal open={weighIn} onClose={() => setWeighIn(false)} />
    </div>
  )
}

// Compact skate-score strip — the full forecast lives one tap away.
function ConditionsBanner() {
  const wx = useWeather()
  const s = !wx.loading && !wx.error ? scoreConditions(wx.w) : null

  return (
    <Link to="/weather" className="card flex items-center gap-3 !py-3 hover:border-volt-500/40 transition group">
      {s ? (
        <>
          <span className={`shrink-0 ${s.score >= 60 ? 'text-volt-400' : 'text-ember-400'}`}><Icon name={s.icon} size={30} /></span>
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-white truncate group-hover:text-volt-400 transition">{s.verdict}</div>
            <div className="text-xs text-slate-400 truncate">{wx.w.temp}°F · {wx.w.wind} mph wind · {wx.w.rain}% rain</div>
          </div>
          <div className="text-right shrink-0">
            <div className={`font-display text-2xl font-bold tabular-nums ${s.score >= 60 ? 'text-volt-400' : 'text-ember-400'}`}>{s.score}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Score</div>
          </div>
        </>
      ) : (
        <>
          <span className="shrink-0 text-slate-500"><Icon name="partly_cloudy_day" size={30} /></span>
          <div className="flex-1">
            <div className="font-display font-bold text-slate-300">Skate conditions</div>
            <div className="text-xs text-slate-500">{wx.loading ? 'Checking the sky…' : 'Tap for the forecast'}</div>
          </div>
          <Icon name="arrow_forward" size={18} className="text-slate-500 shrink-0" />
        </>
      )}
    </Link>
  )
}

// Day one. There are no numbers to show, so don't show numbers — show the way in.
function FirstRun({ name }) {
  const setup = [
    { icon: 'monitor_weight', title: 'Log a starting weight', desc: 'Optional. It just gives the trend line somewhere to begin.', to: '/weight', cta: 'Log weight' },
    { icon: 'map', title: 'Pick a guided program', desc: 'Ten plans combining skating, strength and recovery.', to: '/programs', cta: 'Browse programs' },
    { icon: 'build', title: 'Add your skates', desc: 'Wheel and bearing mileage then logs itself as you skate.', to: '/gear', cta: 'Add gear' },
  ]

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <div className="text-sm text-slate-400">{greeting()}, {name}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 leading-tight">
          Welcome to SkateFit.<br />
          <span className="text-volt-400">Let's get your first skate in.</span>
        </h1>
        <p className="text-sm text-slate-400 mt-2.5 max-w-lg leading-relaxed">
          Nothing here yet — and that's exactly right. This is your account, not a demo. Every mile,
          meal and milestone that shows up below will be one you actually earned.
        </p>
      </div>

      <Link
        to="/skate"
        className="card block border-volt-500/40 bg-volt-500/[0.05] hover:bg-volt-500/[0.09] transition text-center py-8"
      >
        <div className="mb-3 text-volt-400"><Icon name="roller_skating" size={52} /></div>
        <div className="font-display text-xl font-bold text-white">Start your first skate</div>
        <div className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
          Nine disciplines, GPS tracking, and a demo mode for when you're stuck indoors.
        </div>
        <span className="btn-primary mt-5 inline-flex">Let's roll</span>
      </Link>

      <div>
        <SectionTitle>Or set yourself up first</SectionTitle>
        <div className="grid sm:grid-cols-3 gap-3">
          {setup.map((s) => (
            <Link key={s.to} to={s.to} className="card hover:border-volt-500/40 transition group">
              <div className="text-volt-400"><Icon name={s.icon} size={24} /></div>
              <div className="font-display font-bold text-white mt-1.5 group-hover:text-volt-400 transition">{s.title}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</div>
              <div className="text-xs font-semibold text-volt-400 mt-2.5">{s.cta} →</div>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <SectionTitle>What Skate measures</SectionTitle>
        <p className="text-sm text-slate-400 leading-relaxed">
          Not just the scale. Miles skated, workouts completed, calories burned, time active, streaks,
          programs finished — and weight, when you want it. The question this app asks isn't "did you
          lose weight today?" It's: did you get outside? did you move? are you becoming a better skater?
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['0 miles', '0 workouts', '0 cal burned', '0-day streak'].map((t) => (
            <span key={t} className="chip bg-ink-700 text-slate-500">{t}</span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Everyone starts at zero. Want to look around with example data first? Profile → Load sample data.
        </p>
      </Card>
    </div>
  )
}
