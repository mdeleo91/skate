import { NavLink, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Icon from './icons'

const PRIMARY = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/skate', label: 'Skate', icon: 'roller_skating' },
  { to: '/nutrition', label: 'Fuel', icon: 'nutrition' },
  { to: '/progress', label: 'Progress', icon: 'monitoring' },
  { to: '/more', label: 'More', icon: 'more_horiz' },
]

const ALL_LINKS = [
  { to: '/programs', label: 'Guided Programs', icon: 'map', desc: 'Structured plans that build a skater' },
  { to: '/history', label: 'Skate History', icon: 'history', desc: 'Every session, every route' },
  { to: '/routes', label: 'Route Collection', icon: 'route', desc: 'Trails, parks, neighborhood loops' },
  { to: '/stats', label: 'Lifetime Stats', icon: 'sports_score', desc: 'Totals and personal records' },
  { to: '/weight', label: 'Weight Tracking', icon: 'monitor_weight', desc: 'Trend over noise' },
  { to: '/photos', label: 'Progress Photos', icon: 'photo_camera', desc: 'Front, side, back — month by month' },
  { to: '/calendar', label: 'Activity Calendar', icon: 'calendar_month', desc: 'Your consistency at a glance' },
  { to: '/achievements', label: 'Achievements', icon: 'trophy', desc: 'Distance, fitness, weight, consistency' },
  { to: '/challenges', label: 'Challenges', icon: 'target', desc: 'Weekly and monthly targets' },
  { to: '/gear', label: 'Gear Tracker', icon: 'build', desc: 'Wheels, bearings, boots, mileage' },
  { to: '/weather', label: 'Weather', icon: 'partly_cloudy_day', desc: 'Is it a good day to skate?' },
  { to: '/profile', label: 'Profile & Settings', icon: 'settings', desc: 'Goals, body stats, account' },
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
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/80 backdrop-blur-xl pt-[var(--sat)]">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/pwa-192x192.png" alt="" className="h-8 w-8 rounded-lg shadow-glow" />
            <span className="font-display text-lg font-bold tracking-tight text-white">Skate<span className="text-volt-400">Fit</span></span>
            {demoMode && <span className="chip bg-ember-500/20 text-ember-400 ml-1">Demo</span>}
          </Link>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="chip bg-volt-500/15 text-volt-400" title="Current streak"><Icon name="local_fire_department" size={13} /> {streak}d</span>
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

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-ink-900/95 backdrop-blur-xl pb-[var(--sab)]">
        <div className="grid grid-cols-5">
          {PRIMARY.map((l) => {
            const active = l.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(l.to)
            return (
              <NavLink key={l.to} to={l.to} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${active ? 'text-volt-400' : 'text-slate-500'}`}>
                <Icon name={l.icon} size={21} />
                {l.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
