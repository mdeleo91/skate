import { NavLink, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const PRIMARY = [
  { to: '/', label: 'Today', icon: '◎' },
  { to: '/skate', label: 'Skate', icon: '🛼' },
  { to: '/nutrition', label: 'Fuel', icon: '🍎' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/more', label: 'More', icon: '⋯' },
]

const ALL_LINKS = [
  { to: '/programs', label: 'Guided Programs', icon: '🗺️', desc: 'Structured plans that build a skater' },
  { to: '/history', label: 'Skate History', icon: '📜', desc: 'Every session, every route' },
  { to: '/routes', label: 'Route Collection', icon: '🛣️', desc: 'Trails, parks, neighborhood loops' },
  { to: '/stats', label: 'Lifetime Stats', icon: '🏁', desc: 'Totals and personal records' },
  { to: '/weight', label: 'Weight Tracking', icon: '⚖️', desc: 'Trend over noise' },
  { to: '/photos', label: 'Progress Photos', icon: '📸', desc: 'Front, side, back — month by month' },
  { to: '/calendar', label: 'Activity Calendar', icon: '📅', desc: 'Your consistency at a glance' },
  { to: '/achievements', label: 'Achievements', icon: '🏆', desc: 'Distance, fitness, weight, consistency' },
  { to: '/challenges', label: 'Challenges', icon: '🎯', desc: 'Weekly and monthly targets' },
  { to: '/gear', label: 'Gear Tracker', icon: '🔧', desc: 'Wheels, bearings, boots, mileage' },
  { to: '/weather', label: 'Weather', icon: '🌤️', desc: 'Is it a good day to skate?' },
  { to: '/profile', label: 'Profile & Settings', icon: '⚙️', desc: 'Goals, body stats, account' },
]

export { ALL_LINKS }

export default function Layout({ children }) {
  const { user, signOut, demoMode } = useAuth()
  const data = useData()
  const loc = useLocation()
  const [menu, setMenu] = useState(false)
  const streak = data?.d?.streak ?? 0

  return (
    <div className="min-h-full pb-24 sm:pb-8">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-volt-500 text-ink-900 font-display font-bold shadow-glow">S</span>
            <span className="font-display text-lg font-bold tracking-tight text-white">Skate</span>
            {demoMode && <span className="chip bg-ember-500/20 text-ember-400 ml-1">Demo</span>}
          </Link>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="chip bg-volt-500/15 text-volt-400" title="Current streak">🔥 {streak}d</span>
            )}
            <div className="relative">
              <button onClick={() => setMenu((v) => !v)} className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 border border-white/10 text-sm font-bold text-slate-200">
                {(user?.email || '?')[0].toUpperCase()}
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl border border-white/10 bg-ink-800 p-2 shadow-2xl">
                    <div className="px-3 py-2 text-xs text-slate-400 truncate">{user?.email}</div>
                    <Link to="/profile" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Profile & Settings</Link>
                    <button onClick={signOut} className="block w-full text-left rounded-lg px-3 py-2 text-sm text-ember-400 hover:bg-white/5">Sign out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <nav className="hidden sm:block border-t border-white/5">
          <div className="mx-auto max-w-5xl px-4 flex gap-1 overflow-x-auto no-scrollbar">
            {[...PRIMARY.slice(0, 4), ...ALL_LINKS].map((l) => (
              <NavLink
                key={l.to} to={l.to}
                className={({ isActive }) => `whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition ${
                  isActive ? 'border-volt-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-ink-900/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {PRIMARY.map((l) => {
            const active = l.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(l.to)
            return (
              <NavLink key={l.to} to={l.to} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${active ? 'text-volt-400' : 'text-slate-500'}`}>
                <span className="text-lg leading-none">{l.icon}</span>
                {l.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
