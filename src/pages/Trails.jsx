import { useEffect, useState } from 'react'
import { Card } from '../components/ui'
import Icon from '../components/icons'
import { fetchNearbyTrails } from '../lib/trails'
import { getCurrentPosition } from '../lib/geo'

const RADII = [
  { label: '5 mi', m: 8000 },
  { label: '10 mi', m: 16000 },
  { label: '25 mi', m: 40000 },
]

export default function Trails() {
  const [radius, setRadius] = useState(RADII[1].m)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let alive = true
    setState({ loading: true })
    const go = (lat, lon, place) => {
      fetchNearbyTrails(lat, lon, radius)
        .then((trails) => alive && setState({ loading: false, trails, place }))
        .catch((e) => alive && setState({ loading: false, error: e.message }))
    }
    getCurrentPosition()
      .then((pos) => go(pos.coords.latitude, pos.coords.longitude, 'your location'))
      .catch((e) => alive && setState({ loading: false, error: e.message }))
    return () => { alive = false }
  }, [radius, attempt])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title">Find Trails</h1>
        <p className="text-sm text-slate-500 mt-1">
          Named, paved paths and cycleways near you — rail trails, greenways, park loops. Data from OpenStreetMap.
        </p>
      </div>

      <div className="flex gap-1.5">
        {RADII.map((r) => (
          <button
            key={r.m}
            onClick={() => setRadius(r.m)}
            className={`chip !px-3 !py-1.5 ${radius === r.m ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}
          >
            Within {r.label}
          </button>
        ))}
      </div>

      {state.loading && (
        <div className="card text-center py-12 text-sm text-slate-400">Scanning the map for skateable pavement…</div>
      )}

      {state.error && (
        <div className="card text-center py-10">
          <div className="mb-2 text-slate-400"><Icon name="travel_explore" size={32} /></div>
          <div className="text-slate-200 font-semibold">Couldn't search for trails</div>
          <div className="text-sm text-slate-500 mt-1">{state.error}</div>
          <button onClick={() => setAttempt((a) => a + 1)} className="btn-ghost mt-4">Try again</button>
        </div>
      )}

      {state.trails && state.trails.length === 0 && (
        <div className="card text-center py-10 text-sm text-slate-400">
          No named paved trails found in this radius. Try widening the search — or you may have just found
          a gap in OpenStreetMap's coverage.
        </div>
      )}

      {state.trails && state.trails.length > 0 && (
        <div className="space-y-3">
          {state.trails.map((t) => <TrailCard key={t.name} trail={t} />)}
          <p className="text-xs text-slate-500 text-center">
            Lengths are the mapped extent within your search radius — long trails continue beyond it.
          </p>
        </div>
      )}
    </div>
  )
}

function TrailCard({ trail }) {
  const awayMi = trail.minDistM / 1609.344
  const lengthMi = trail.lengthM / 1609.344
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${trail.nearest.lat.toFixed(6)},${trail.nearest.lon.toFixed(6)}`
  return (
    <Card className="flex items-center gap-4">
      <TrailPreview segments={trail.segments} />
      <div className="min-w-0 flex-1">
        <div className="font-display font-bold text-white truncate">{trail.name}</div>
        <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
          {awayMi < 0.2 ? 'right here' : `${awayMi.toFixed(1)} mi away`} · ~{lengthMi.toFixed(1)} mi mapped
          {trail.surface ? ` · ${trail.surface}` : ''}
        </div>
        <a href={maps} target="_blank" rel="noreferrer" className="btn-ghost !py-1 !px-2.5 text-xs mt-2 inline-flex">
          <Icon name="my_location" size={13} /> Directions
        </a>
      </div>
    </Card>
  )
}

// Tiny shape preview — every mapped segment of the trail, scaled into a box.
function TrailPreview({ segments }) {
  const pts = segments.flat()
  if (pts.length < 2) return null
  const lats = pts.map((p) => p.lat)
  const lons = pts.map((p) => p.lon)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const W = 72, H = 72, pad = 6
  const spanLat = Math.max(1e-6, maxLat - minLat)
  const spanLon = Math.max(1e-6, maxLon - minLon)
  const scale = Math.min((W - pad * 2) / spanLon, (H - pad * 2) / spanLat)
  const x = (lon) => pad + (lon - minLon) * scale + ((W - pad * 2) - spanLon * scale) / 2
  const y = (lat) => H - pad - (lat - minLat) * scale - ((H - pad * 2) - spanLat * scale) / 2
  return (
    <svg width={W} height={H} className="shrink-0 rounded-xl bg-ink-700">
      {segments.map((seg, i) => (
        <polyline
          key={i}
          points={seg.map((p) => `${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`).join(' ')}
          fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
