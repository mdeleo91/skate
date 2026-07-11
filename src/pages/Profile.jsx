import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Card, SectionTitle, Stat } from '../components/ui'
import { calorieBudget, macroTargets, bmiLabel } from '../lib/calc'
import { isSupabaseConfigured } from '../lib/supabase'

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

      <Card>
        <SectionTitle>Account & Data</SectionTitle>
        <div className="text-sm text-slate-400 space-y-1 mb-4">
          <div>Auth: <span className="text-slate-200">{isSupabaseConfigured ? 'Supabase (email + password)' : 'Demo mode (local only)'}</span></div>
          <div>Data: <span className="text-slate-200">stored locally in this browser</span></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            onClick={() => { if (confirm('Reset all workouts, meals, weights and gear back to sample data?')) data.resetAll() }}
            className="btn-ghost"
          >
            Reset to sample data
          </button>
          <button onClick={signOut} className="btn-ghost !text-ember-400">Sign out</button>
        </div>
      </Card>
    </div>
  )
}
