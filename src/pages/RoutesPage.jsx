import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, RouteMap, EmptyState, Modal } from '../components/ui'

const CATS = ['All', 'Favorites', 'Trails', 'Parks', 'Neighborhood', 'Longest', 'Scenic']

export default function RoutesPage() {
  const data = useData()
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState(null)
  if (!data) return null

  const routes = data.d.routes
  const favNames = new Set(data.favoriteRoutes.map((r) => r.name))

  let list = routes
  if (cat === 'Favorites') list = routes.filter((r) => favNames.has(r.name))
  else if (cat === 'Longest') list = [...routes].sort((a, b) => b.bestMiles - a.bestMiles).slice(0, 5)
  else if (cat === 'Trails') list = routes.filter((r) => /trail|greenway|path|lake/i.test(r.name))
  else if (cat === 'Parks') list = routes.filter((r) => /park|loop/i.test(r.name))
  else if (cat === 'Neighborhood') list = routes.filter((r) => /neighborhood|laps|work|commute/i.test(r.name))
  else if (cat === 'Scenic') list = [...routes].sort((a, b) => b.elevation - a.elevation).slice(0, 5)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Route Collection</h1>
        <p className="text-sm text-slate-500 mt-1">The places you skate, and how you're doing on each of them.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`chip whitespace-nowrap !px-3 !py-1.5 ${cat === c ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState emoji="🛣️" title="No routes here yet" desc="Routes appear once you name and log a skate." cta="Start a skate" to="/skate" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((r) => {
            const sample = data.d.skates.find((w) => w.name === r.name && w.route?.length > 2)
            return (
              <button key={r.name} onClick={() => setOpen({ ...r, route: sample?.route })} className="card text-left hover:border-volt-500/40 transition">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="font-display font-bold text-white truncate">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.count} skates · last {r.lastDate}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); data.toggleFavoriteRoute(r.name) }}
                    className={`text-lg leading-none ${favNames.has(r.name) ? 'text-volt-400' : 'text-slate-600'}`}
                  >
                    ★
                  </button>
                </div>
                {sample?.route && <div className="mt-3"><RouteMap points={sample.route} height={110} /></div>}
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <Mini label="Best" value={`${r.bestMiles.toFixed(1)} mi`} />
                  <Mini label="Fastest" value={`${r.bestAvg.toFixed(1)} mph`} />
                  <Mini label="Total" value={`${r.totalMiles.toFixed(0)} mi`} />
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name || ''}>
        {open && (
          <div className="space-y-3">
            {open.route && <RouteMap points={open.route} height={170} />}
            <div className="card-tight divide-y divide-white/5 text-sm">
              {[
                ['Times skated', open.count],
                ['Longest', `${open.bestMiles.toFixed(2)} mi`],
                ['Fastest avg', `${open.bestAvg.toFixed(1)} mph`],
                ['Total distance', `${open.totalMiles.toFixed(1)} mi`],
                ['Max elevation gain', `${open.elevation} ft`],
                ['Last skated', open.lastDate],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-slate-100 font-medium tabular-nums">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Skate it again and Skate will compare your time against your best on this route.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="card-tight !p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-display text-sm font-bold text-white tabular-nums">{value}</div>
    </div>
  )
}
