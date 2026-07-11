import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/icons'

const HIGHLIGHTS = [
  { icon: 'roller_skating', title: 'Skating is the workout', desc: 'Nine disciplines, each with its own calorie model and stats.' },
  { icon: 'monitoring', title: 'Trends over daily noise', desc: 'One bad weigh-in is weather. The trend line is climate.' },
  { icon: 'local_fire_department', title: 'Consistency you can see', desc: 'Streaks, calendars, and programs that ask: did you get outside?' },
]

export default function Login() {
  const { user, signIn, signUp, demoMode, demoSignIn, loading } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    if (password.length < 6) return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
    setBusy(true)
    const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (res?.error) setMsg({ type: 'error', text: res.error })
    else if (res?.info) setMsg({ type: 'info', text: res.info })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/2 px-6 pt-12 pb-8 lg:p-14 lg:flex lg:flex-col lg:justify-center">
        <div className="flex items-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt-500 text-ink-900 font-display text-xl font-bold shadow-glow">S</span>
          <span className="font-display text-2xl font-bold tracking-tight text-white">Skate</span>
        </div>
        <h1 className="mt-8 font-display text-4xl lg:text-5xl font-bold leading-[1.08] text-white">
          The goal isn't to lose weight.<br />
          <span className="text-volt-400">It's to become a better skater.</span>
        </h1>
        <p className="mt-4 text-slate-400 max-w-md leading-relaxed">
          Most fitness apps file inline skating under "generic cardio." Skate builds everything —
          calories, programs, progress — around the sport itself. The weight loss follows.
        </p>
        <div className="mt-8 space-y-3 max-w-md">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
              <span className="text-volt-400"><Icon name={h.icon} size={22} /></span>
              <div>
                <div className="font-semibold text-slate-100 text-sm">{h.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:w-1/2 px-6 pb-12 lg:p-14 lg:flex lg:items-center lg:justify-center">
        <div className="w-full max-w-sm mx-auto">
          <div className="card">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-700 p-1 mb-5">
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setMsg(null) }}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${mode === m ? 'bg-volt-500 text-ink-900' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" required autoComplete="email" className="input"
                  placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" required minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="input"
                  placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {msg && (
                <div className={`rounded-xl px-3 py-2.5 text-sm ${
                  msg.type === 'error' ? 'bg-ember-500/15 text-ember-400 border border-ember-500/25'
                    : 'bg-surge-500/15 text-surge-400 border border-surge-500/25'}`}>
                  {msg.text}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}
              </button>
            </form>

            {demoMode && (
              <div className="mt-5 border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 mb-3">
                  Supabase isn't configured in this environment, so the app is running in demo mode.
                  Your data is saved locally in this browser.
                </p>
                <button onClick={() => demoSignIn(email || 'demo@skate.app')} className="btn-ghost w-full">
                  Continue in demo mode
                </button>
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Encouraging, not obsessive. No shame, just miles.
          </p>
        </div>
      </div>
    </div>
  )
}
