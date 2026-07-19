import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Icon from '../components/icons'
import WeighInModal from '../components/WeighInModal'
import { Card, Bar, Sparkline, SectionTitle, CalorieRing } from '../components/ui'
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
            ? "Let's keep this momentum going!"
            : 'Even 15 easy minutes keeps the streak alive.'}
        </p>
      </div>

      <ConditionsBanner />

      {/* Energy budget — ring left, ledger right, exactly like the mock */}
      <Card className="flex items-center gap-5">
        <CalorieRing consumed={d.consumed} total={d.budget.target + d.burned} />
        <div className="flex-1 space-y-2.5 text-sm border-l border-white/5 pl-5">
          <div className="flex justify-between"><span className="text-slate-400">Base goal</span><span className="tabular-nums font-semibold">{d.budget.target.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Consumed</span><span className="tabular-nums font-semibold text-ember-400">−{d.consumed.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Burned</span><span className="tabular-nums font-semibold text-volt-400">+{d.burned.toLocaleString()}</span></div>
          <Link to="/nutrition" className="btn-ghost w-full !py-2 text-sm mt-1 !justify-between">Log Food <Icon name="arrow_forward" size={16} /></Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Today's Skate" icon="roller_skating" iconClass="text-slate-300" value={d.milesToday.toFixed(1)} unit="mi" valueClass="text-volt-400" sub={`${dailyMilesGoal} mi daily target`}>
          <Bar value={d.milesToday} goal={dailyMilesGoal} className="mt-2" />
        </StatCard>
        <StatCard label="Water" icon="water_drop" iconClass="text-surge-400" value={d.waterToday} unit="oz" valueClass="text-surge-400">
          <Bar value={d.waterToday} goal={profile.waterGoalOz} color="bg-surge-500" className="mt-2" />
          <div className="mt-2 flex gap-1.5">
            {[8, 16].map((oz) => (
              <button key={oz} onClick={() => addWater(oz)} className="btn-ghost flex-1 !py-1 !px-2 text-xs">+{oz} oz</button>
            ))}
          </div>
        </StatCard>
        <StatCard
          label="Calories Consumed" icon="local_fire_department" iconClass="text-amber-500"
          value={d.consumed.toLocaleString()}
          sub={d.consumed <= d.budget.target
            ? `${Math.round((1 - d.consumed / d.budget.target) * 100)}% under`
            : `${Math.round((d.consumed / d.budget.target - 1) * 100)}% over`}
        />
        <StatCard label="Calories Burned" icon="local_fire_department" iconClass="text-volt-400" value={d.burned.toLocaleString()} valueClass="text-volt-400" sub="From activity today" />
        <StatCard label="Active Minutes" icon="timer" iconClass="text-volt-400" value={d.activeMinutesToday} sub="Today" />
        <StatCard label="Current Streak" icon="local_fire_department" iconClass="text-ember-400" value={`${d.streak}d`} valueClass="text-ember-400" sub={`Best: ${d.bestStreak}d`} />
      </div>

      <CalorieTrendCard meals={data.meals} />

      <Card>
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Next Goal</div>
          <Link to="/achievements" className="flex items-center gap-1 text-xs text-slate-400 font-semibold hover:text-slate-200">
            All Goals <Icon name="arrow_forward" size={14} />
          </Link>
        </div>
        {nextGoal ? (
          <>
            <div className="flex items-center gap-4 mt-3">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center bg-volt-500/12 text-volt-400"
                style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}
              >
                <Icon name={nextGoal.icon} size={26} />
              </span>
              <div className="min-w-0">
                <div className="font-display font-bold text-white">{nextGoal.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{nextGoal.desc}</div>
              </div>
            </div>
            <Bar value={nextGoal.cur} goal={nextGoal.goal} className="mt-3" />
            <div className="text-xs text-volt-400 mt-1.5 tabular-nums font-semibold">
              {Math.round(nextGoal.cur * 10) / 10} / {nextGoal.goal} there — {Math.round(nextGoal.pct)}%
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-400 mt-2">Every achievement unlocked. Remarkable.</div>
        )}
      </Card>

      <div className="grid sm:grid-cols-1 gap-3">
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
            <div className="text-xs text-slate-400 truncate">
              {wx.w.temp}°F • {wx.w.wind} mph wind • {wx.w.rain}% rain
              {wx.place && wx.place !== 'Your location' ? ` • ${wx.place}` : ''}
            </div>
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

// Mock-style stat tile: label + icon up top, big number, optional extras.
function StatCard({ label, icon, iconClass = 'text-slate-400', value, unit, valueClass = 'text-white', sub, children }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        {icon && <span className={`shrink-0 ${iconClass}`}><Icon name={icon} size={20} /></span>}
      </div>
      <div className={`metric mt-1 ${valueClass}`}>
        {value}{unit && <span className="text-base text-slate-500 ml-1">{unit}</span>}
      </div>
      {children}
      {sub && <div className="text-xs text-slate-500 mt-1.5">{sub}</div>}
    </Card>
  )
}

// Daily calories consumed over the last four weeks, with the average dashed
// in and a delta vs the four weeks before. Hidden until there's enough data.
function CalorieTrendCard({ meals }) {
  const now = new Date()
  const dayMs = 24 * 3600 * 1000
  const cutoff = new Date(now.getTime() - 27 * dayMs)
  const prevCutoff = new Date(now.getTime() - 55 * dayMs)
  const byDay = {}
  for (const m of meals || []) {
    const t = new Date(m.date + 'T12:00')
    if (t >= prevCutoff) byDay[m.date] = (byDay[m.date] || 0) + (m.calories || 0)
  }
  const entries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  const cur = entries.filter(([k]) => new Date(k + 'T12:00') >= cutoff)
  if (cur.length < 3) return null

  const values = cur.map(([, v]) => v)
  const avg = Math.round(values.reduce((a, v) => a + v, 0) / values.length)
  const prev = entries.filter(([k]) => new Date(k + 'T12:00') < cutoff).map(([, v]) => v)
  const prevAvg = prev.length >= 3 ? prev.reduce((a, v) => a + v, 0) / prev.length : null
  const delta = prevAvg ? Math.round(((avg - prevAvg) / prevAvg) * 100) : null

  // Chart geometry
  const W = 300, H = 76
  const lo = Math.min(...values), hi = Math.max(...values)
  const span = Math.max(1, hi - lo)
  const x = (i) => (values.length > 1 ? (i / (values.length - 1)) * W : W / 2)
  const y = (v) => H - 6 - ((v - lo) / span) * (H - 16)
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const fmtDate = (iso) => `${+iso.slice(5, 7)}/${+iso.slice(8, 10)}`
  const ticks = [cur[0][0], cur[Math.floor(cur.length / 2)][0], cur[cur.length - 1][0]]

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Calorie Trend</div>
        <Link to="/nutrition" aria-label="Nutrition" className="text-slate-400 hover:text-slate-200"><Icon name="arrow_forward" size={16} /></Link>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-display text-2xl font-bold tabular-nums text-white">{avg.toLocaleString()}</span>
        <span className="text-sm text-slate-400">Avg</span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 min-w-0">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="calTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon points={`0,${H} ${line} ${W},${H}`} fill="url(#calTrend)" />
            <polyline points={line} fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <line x1="0" y1={y(avg)} x2={W} y2={y(avg)} stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <div className="flex justify-between text-[10px] text-slate-500 tabular-nums mt-0.5">
            {ticks.map((t) => <span key={t}>{fmtDate(t)}</span>)}
          </div>
        </div>
        {delta != null && (
          <div className={`shrink-0 text-right text-xs leading-tight ${delta <= 0 ? 'text-volt-400' : 'text-ember-400'}`}>
            <div className="font-semibold flex items-center justify-end gap-0.5">
              <Icon name="arrow_downward" size={13} className={delta > 0 ? 'rotate-180' : ''} /> {Math.abs(delta)}%
            </div>
            <div className="text-slate-500 mt-0.5">vs last<br />4 weeks</div>
          </div>
        )}
      </div>
    </Card>
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
