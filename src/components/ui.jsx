import { Link } from 'react-router-dom'
import Icon from './icons'

export function Card({ className = '', children, ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="h-sec">{children}</h2>
      {action}
    </div>
  )
}

export function Stat({ label, value, sub, accent = 'text-white', className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`font-display text-2xl font-bold tabular-nums mt-1 ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export function Bar({ value, goal, color = 'bg-volt-500', className = '' }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className={`h-2 w-full rounded-full bg-white/10 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Ring({ value, goal, size = 132, stroke = 12, label, sub, color = '#A3F015' }) {
  const pct = goal > 0 ? Math.max(0, Math.min(1, value / goal)) : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="rgba(255,255,255,0.08)" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={color} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-2xl font-bold tabular-nums text-white leading-none">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  )
}

export function Sparkline({ data, width = 300, height = 70, color = '#A3F015', fill = true, trend }) {
  if (!data || data.length < 2) return <div className="h-[70px] grid place-items-center text-xs text-slate-500">Not enough data yet</div>
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 4
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / span) * (height - pad * 2)
    return [x, y]
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`

  // Simple linear regression for the trend line — the number that actually matters.
  let trendPath = null
  if (trend) {
    const n = data.length
    const sx = data.reduce((a, _, i) => a + i, 0)
    const sy = data.reduce((a, v) => a + v, 0)
    const sxy = data.reduce((a, v, i) => a + i * v, 0)
    const sxx = data.reduce((a, _, i) => a + i * i, 0)
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1)
    const intercept = (sy - slope * sx) / n
    const yAt = (i) => pad + (1 - (slope * i + intercept - min) / span) * (height - pad * 2)
    trendPath = `M${pad},${yAt(0).toFixed(1)} L${(width - pad).toFixed(1)},${yAt(n - 1).toFixed(1)}`
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#g-${color.slice(1)})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity={trend ? 0.45 : 1} />
      {trendPath && <path d={trendPath} fill="none" stroke="#43E9FF" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />}
    </svg>
  )
}

export function RouteMap({ points, height = 160, color = '#A3F015' }) {
  if (!points || points.length < 2) {
    return <div className="grid place-items-center text-xs text-slate-500 rounded-xl bg-ink-700" style={{ height }}>No GPS trace</div>
  }
  const lats = points.map((p) => p.lat)
  const lons = points.map((p) => p.lon)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const w = 320, h = height, pad = 12
  const sx = (lon) => pad + ((lon - minLon) / (maxLon - minLon || 1)) * (w - pad * 2)
  const sy = (lat) => h - pad - ((lat - minLat) / (maxLat - minLat || 1)) * (h - pad * 2)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.lon).toFixed(1)},${sy(p.lat).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded-xl bg-ink-700" style={{ height }}>
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(points[0].lon)} cy={sy(points[0].lat)} r="4.5" fill="#43E9FF" />
      <circle cx={sx(points[points.length - 1].lon)} cy={sy(points[points.length - 1].lat)} r="4.5" fill="#FF7A45" />
    </svg>
  )
}

// The first thing a new user sees on most screens. It should feel like an invitation,
// not an error message — no "no data found", no empty tables, no shame.
export function EmptyState({ icon = 'roller_skating', title, desc, cta, to, onClick, hint, children }) {
  return (
    <div className="card text-center py-10 px-5">
      <div className="mb-3 text-volt-400"><Icon name={icon} size={44} /></div>
      <div className="font-display font-bold text-white text-lg">{title}</div>
      {desc && <div className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">{desc}</div>}
      {cta && to && <Link to={to} className="btn-primary mt-5 inline-flex">{cta}</Link>}
      {cta && !to && onClick && (
        <button onClick={onClick} className="btn-primary mt-5 inline-flex">{cta}</button>
      )}
      {children}
      {hint && <div className="text-xs text-slate-500 mt-3.5 max-w-sm mx-auto">{hint}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/10 bg-ink-800 p-5"
        style={{ paddingBottom: 'calc(1.25rem + var(--sab))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none px-2">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const COLORS = { volt: '#A3F015', surge: '#43E9FF', ember: '#FF7A45' }
