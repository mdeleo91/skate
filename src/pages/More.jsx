import { Link } from 'react-router-dom'
import { ALL_LINKS } from '../components/Layout'
import { useData } from '../context/DataContext'
import Icon from '../components/icons'

export default function More() {
  const data = useData()
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Everything Else</h1>
        <p className="text-sm text-slate-500 mt-1">
          {data?.d ? `${data.d.totalMiles.toFixed(0)} lifetime miles and counting.` : 'Your full toolkit.'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {ALL_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="card flex items-center gap-3 hover:border-volt-500/40 transition group">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-700 text-slate-300"><Icon name={l.icon} size={22} /></span>
            <div className="min-w-0">
              <div className="font-display font-bold text-white group-hover:text-volt-400 transition">{l.label}</div>
              <div className="text-xs text-slate-400 truncate">{l.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
