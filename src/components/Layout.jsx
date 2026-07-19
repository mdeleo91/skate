import { NavLink, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from './icons'

const PRIMARY = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/skate', label: 'Skate', icon: 'roller_skating' },
  { to: '/history', label: 'Workouts', icon: 'fitness_center' },
  { to: '/nutrition', label: 'Nutrition', icon: 'nutrition' },
  { to: '/progress', label: 'Progress', icon: 'monitoring' },
]

const ALL_LINKS = [
  { to: '/programs', label: 'Guided Programs', icon: 'map', desc: 'Structured plans that build a skater' },
  { to: '/history', label: 'Skate History', icon: 'history', desc: 'Every session, every route' },
  { to: '/routes', label: 'Route Collection', icon: 'route', desc: 'Trails, parks, neighborhood loops' },
  { to: '/trails', label: 'Find Trails', icon: 'travel_explore', desc: 'Paved paths and rail trails near you' },
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
  const loc = useLocation()
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="min-h-full pb-24 sm:pb-8">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/85 backdrop-blur-xl pt-[var(--sat)]">
        <div className="mx-auto max-w-5xl px-3 h-14 grid grid-cols-[auto_1fr_auto] items-center">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-200 hover:bg-white/5"
          >
            <Icon name="menu" size={24} />
          </button>
          <Link to="/" className="justify-self-center flex items-center gap-2">
            <img src="/wordmark.svg" alt="SkateFit" className="h-[20px]" />
            {demoMode && <span className="chip bg-ember-500/20 text-ember-400">Demo</span>}
          </Link>
          <Link
            to="/achievements"
            aria-label="Achievements"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-200 hover:bg-white/5"
          >
            <Icon name="notifications" size={22} />
          </Link>
        </div>
        <nav className="hidden sm:block border-t border-white/5">
          <div className="mx-auto max-w-5xl px-4 flex gap-1 overflow-x-auto no-scrollbar">
            {[...PRIMARY, ...ALL_LINKS.filter((l) => !PRIMARY.some((p) => p.to === l.to))].map((l) => (
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

      {/* Slide-over menu — everything that isn't one of the five tabs. */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-ink-800 border-r border-white/10 pt-[var(--sat)] pb-[var(--sab)]">
            <div className="flex items-center justify-between px-4 h-14">
              <span className="flex items-center gap-2">
                <img src="/brand-icon.svg" alt="" className="h-7 w-7" />
                <img src="/wordmark.svg" alt="SkateFit" className="h-[16px]" />
              </span>
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/5 text-xl">×</button>
            </div>
            <div className="px-4 py-2 text-xs text-slate-500 truncate">{user?.email}</div>
            <div className="p-2">
              {ALL_LINKS.map((l) => (
                <Link
                  key={l.to} to={l.to} onClick={() => setDrawer(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    loc.pathname.startsWith(l.to) ? 'bg-volt-500/10 text-volt-400' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon name={l.icon} size={20} className="text-slate-400" />
                  <span className="font-medium">{l.label}</span>
                </Link>
              ))}
              <button
                onClick={signOut}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ember-400 hover:bg-white/5"
              >
                <Icon name="arrow_back" size={20} /> Sign out
              </button>
            </div>
          </aside>
        </>
      )}

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
