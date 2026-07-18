import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Card, SectionTitle, Stat } from '../components/ui'
import InstallApp from '../components/InstallApp'
import AndroidApp from '../components/AndroidApp'
import { calorieBudget, macroTargets, bmiLabel, todayISO } from '../lib/calc'
import { isSupabaseConfigured } from '../lib/supabase'
import { logEntryCount, exportLogText, clearLog } from '../lib/debugLog'

export default function Profile() {
  const data = useData()
  const { user, signOut, demoMode } = useAuth()
  const [saved, setSaved] = useState(false)
  if (!data) return null
  const { profile, setProfile, d } = data

  const set = (k, num = true) => (e) => {
    setProfile({ [k]: num ? +e.target.value : e.target.value })
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  const b = calorieBudget(profile)
  const m = macroTargets(b.target, profile)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Profile & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">{user?.email}{demoMode ? ' · demo mode' : ''}</p>
      </div>

      <Card>
        <SectionTitle action={saved ? <span className="chip bg-volt-500/15 text-volt-400">Saved</span> : null}>You</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Name</label><input className="input" value={profile.name} onChange={set('name', false)} /></div>
          <div><label className="label">Age</label><input type="number" className="input" value={profile.age} onChange={set('age')} /></div>
          <div>
            <label className="label">Sex (for BMR formula)</label>
            <select className="input" value={profile.sex} onChange={set('sex', false)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div><label className="label">Height (inches)</label><input type="number" className="input" value={profile.heightIn} onChange={set('heightIn')} /></div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Goals</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Starting weight (lb)</label><input type="number" step="0.1" className="input" value={profile.startWeightLb} onChange={set('startWeightLb')} /></div>
          <div><label className="label">Goal weight (lb)</label><input type="number" step="0.1" className="input" value={profile.goalWeightLb} onChange={set('goalWeightLb')} /></div>
          <div>
            <label className="label">Target loss per week</label>
            <select className="input" value={profile.weeklyLossLb} onChange={set('weeklyLossLb')}>
              <option value="0.5">0.5 lb — gentle</option>
              <option value="1">1 lb — steady</option>
              <option value="1.5">1.5 lb — aggressive</option>
            </select>
          </div>
          <div>
            <label className="label">Daily activity level</label>
            <select className="input" value={profile.activity} onChange={set('activity')}>
              <option value="1.2">Sedentary desk job</option>
              <option value="1.375">Lightly active</option>
              <option value="1.45">Moderately active</option>
              <option value="1.55">Very active</option>
              <option value="1.725">Athlete</option>
            </select>
          </div>
          <div><label className="label">Water goal (oz)</label><input type="number" className="input" value={profile.waterGoalOz} onChange={set('waterGoalOz')} /></div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Calorie targets never drop below a floor, no matter how aggressive the setting. Under-eating
          makes you a worse skater, and a worse skater burns less.
        </p>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="BMR" value={b.bmr.toLocaleString()} sub="at rest" />
        <Stat label="TDEE" value={b.tdee.toLocaleString()} sub="with activity" />
        <Stat label="Daily Target" value={b.target.toLocaleString()} accent="text-volt-400" sub={`${profile.weeklyLossLb} lb/wk`} />
        <Stat label="BMI" value={d.bmiValue?.toFixed(1) ?? '—'} sub={bmiLabel(d.bmiValue)} />
      </div>

      <Card>
        <SectionTitle>Macro Targets</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Protein', `${m.protein}g`], ['Carbs', `${m.carbs}g`], ['Fat', `${m.fat}g`]].map(([k, v]) => (
            <div key={k} className="card-tight">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div>
              <div className="font-display text-xl font-bold text-white">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Protein is set high on purpose — it protects the muscle that pushes you down the trail.
        </p>
      </Card>

      <AndroidApp />
      <InstallApp />

      <Card>
        <SectionTitle>Account & Data</SectionTitle>
        <div className="text-sm text-slate-400 space-y-1 mb-4">
          <div>Auth: <span className="text-slate-200">{isSupabaseConfigured ? 'Supabase (email + password)' : 'Demo mode (local only)'}</span></div>
          <div>
            Data:{' '}
            {data.cloud.enabled ? (
              <span className={data.cloud.status === 'error' ? 'text-ember-400' : 'text-slate-200'}>
                {data.cloud.status === 'ok' && `synced to your account · ${new Date(data.cloud.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                {data.cloud.status === 'syncing' && 'syncing…'}
                {data.cloud.status === 'error' && (
                  /skate_state|schema cache|PGRST/i.test(data.cloud.detail || '')
                    ? 'sync is on, but the skate_state table is missing — run supabase/schema.sql in your Supabase project (SQL Editor), then reload'
                    : "couldn't reach the cloud — changes are safe on this device and sync when you're back online"
                )}
                {data.cloud.status === 'idle' && 'synced to your account'}
              </span>
            ) : (
              <span className="text-slate-200">stored locally on this device only</span>
            )}
          </div>
          {data.cloud.enabled && (
            <div className="text-xs text-slate-500">
              Sign in on any phone and your skates, meals and weigh-ins come with you. Progress
              photos stay on the device they were taken on.
            </div>
          )}
          {data.isSample && (
            <div className="chip bg-ember-500/15 text-ember-400 mt-1">Sample data loaded</div>
          )}
        </div>

        <div className="card-tight mb-3">
          <div className="font-semibold text-slate-100 text-sm">Sample data</div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Fills the app with a month of example skates, weigh-ins and gear so you can see what every
            screen looks like with history behind it. This is <span className="text-slate-200">not</span> your
            data — it replaces what's here, and you can clear it again at any time.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => {
                if (confirm('Replace everything in this account with example data? Anything you have logged will be overwritten.')) data.loadSampleData()
              }}
              className="btn-ghost !py-1.5 text-xs"
            >
              Load sample data
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all workouts, meals, weigh-ins, photos and gear? This cannot be undone.')) data.clearAll()
              }}
              className="btn-ghost !py-1.5 text-xs !text-ember-400"
            >
              Clear all data
            </button>
          </div>
        </div>

        <DebugLogCard />

        <button onClick={signOut} className="btn-ghost w-full !text-ember-400">Sign out</button>
      </Card>
    </div>
  )
}

// Diagnostic log export — every session start/stop, GPS fix, sensor reading,
// button tap and crash marker, plus the full recorded skate data (routes with
// per-point vibration values). Exists so "the tracker stopped mid-skate" and
// "the roughness read looks wrong" are answerable from data, not guesswork.
function DebugLogCard() {
  const data = useData()
  const [msg, setMsg] = useState(null)
  const count = logEntryCount()

  function note(text) {
    setMsg(text)
    setTimeout(() => setMsg(null), 2500)
  }

  function exportAll() {
    const skates = data?.workouts ?? []
    return [
      `# Skate debug export · ${new Date().toISOString()}`,
      '===== DEBUG LOG =====',
      exportLogText(),
      `===== SKATE DATA (${skates.length} workouts, newest first) =====`,
      ...skates.map((w) => JSON.stringify(w)),
    ].join('\n')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportAll())
      note('Copied — paste it anywhere for review')
    } catch {
      note("Couldn't access the clipboard")
    }
  }

  async function share() {
    try {
      await navigator.share({ title: 'Skate debug log', text: exportAll() })
    } catch { /* user cancelled or unsupported */ }
  }

  function download() {
    const blob = new Blob([exportAll()], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `skate-debug-${todayISO()}.log`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="card-tight mb-3">
      <div className="font-semibold text-slate-100 text-sm">Debug log</div>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
        A diagnostic record of tracking sessions — GPS fixes, vibration readings, button taps,
        crashes and unexpected shutdowns ({count.toLocaleString()} entries) plus every recorded
        skate with its full route data. If a skate ever cuts out or reads wrong, this is how we
        find out why: copy it and send it in for review.
      </p>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <button onClick={copy} className="btn-ghost !py-1.5 text-xs">Copy log</button>
        {typeof navigator.share === 'function'
          ? <button onClick={share} className="btn-ghost !py-1.5 text-xs">Share…</button>
          : <button onClick={download} className="btn-ghost !py-1.5 text-xs">Download</button>}
        <button
          onClick={() => { if (confirm('Clear the debug log?')) { clearLog(); note('Log cleared') } }}
          className="btn-ghost !py-1.5 text-xs !text-ember-400"
        >
          Clear
        </button>
      </div>
      {msg && <div className="text-xs text-volt-400 mt-2">{msg}</div>}
    </div>
  )
}
