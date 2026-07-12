import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import Icon from './icons'
import {
  TILE, lonToWorldX, latToWorldY, fitZoom, trackBounds, segmentSpeeds, speedColor, surfaceColor,
} from '../lib/track'

// Street-tile map with a speed-colored route line. Tiles come from
// OpenStreetMap (free; attribution rendered below) and are CSS-filtered to
// match the app's dark theme. If tiles can't load (offline), the route still
// renders on the dark background — the data never depends on the imagery.
// colorBy: 'speed' (default) grades the line by pace; 'surface' grades it by
// accelerometer roughness — green smooth pavement, orange rough.
export default function TrackMap({ points, height = 260, className = '', colorBy = 'speed' }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const view = useMemo(() => {
    if (!points || points.length < 2 || !width) return null
    const bounds = trackBounds(points)
    const z = fitZoom(bounds, width, height)
    const cx = (lonToWorldX(bounds.minLon, z) + lonToWorldX(bounds.maxLon, z)) / 2
    const cy = (latToWorldY(bounds.minLat, z) + latToWorldY(bounds.maxLat, z)) / 2
    const originX = cx - width / 2
    const originY = cy - height / 2

    const px = points.map((p) => ({
      x: lonToWorldX(p.lon, z) - originX,
      y: latToWorldY(p.lat, z) - originY,
    }))

    let segs
    if (colorBy === 'surface') {
      const hasR = points.some((p) => p.r != null)
      if (hasR) {
        segs = points.slice(1).map((p, i) => ({
          x1: px[i].x, y1: px[i].y, x2: px[i + 1].x, y2: px[i + 1].y,
          color: surfaceColor(p.r ?? points[i].r),
        }))
      }
    }
    if (!segs) {
      const speeds = segmentSpeeds(points)
      if (speeds) {
        const lo = Math.min(...speeds)
        const hi = Math.max(...speeds)
        segs = speeds.map((v, i) => ({
          x1: px[i].x, y1: px[i].y, x2: px[i + 1].x, y2: px[i + 1].y,
          color: speedColor(v, lo, hi),
        }))
      }
    }

    const tiles = []
    const tx0 = Math.floor(originX / TILE)
    const ty0 = Math.floor(originY / TILE)
    const tx1 = Math.floor((originX + width) / TILE)
    const ty1 = Math.floor((originY + height) / TILE)
    const maxTile = 2 ** z
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let ty = Math.max(0, ty0); ty <= Math.min(maxTile - 1, ty1); ty++) {
        tiles.push({
          key: `${z}/${tx}/${ty}`,
          url: `https://tile.openstreetmap.org/${z}/${((tx % maxTile) + maxTile) % maxTile}/${ty}.png`,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        })
      }
    }

    return { px, segs, tiles }
  }, [points, width, height, colorBy])

  if (!points || points.length < 2) {
    return (
      <div className={`grid place-items-center text-xs text-slate-500 rounded-xl bg-ink-700 ${className}`} style={{ height }}>
        No GPS trace for this session
      </div>
    )
  }

  const start = view?.px[0]
  const end = view?.px[view.px.length - 1]

  return (
    <div ref={ref} className={`relative overflow-hidden rounded-xl bg-ink-900 ${className}`} style={{ height }}>
      {view && (
        <>
          {view.tiles.map((t) => (
            <img
              key={t.key}
              src={t.url}
              alt=""
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                left: t.left, top: t.top, width: TILE, height: TILE,
                // Dark-mode restyle of standard OSM tiles.
                filter: 'invert(1) hue-rotate(180deg) brightness(0.62) contrast(1.05) saturate(0.35)',
              }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ))}
          <svg className="absolute inset-0" width="100%" height="100%">
            {view.segs
              ? view.segs.map((s, i) => (
                  <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    stroke={s.color} strokeWidth="5" strokeLinecap="round" />
                ))
              : (
                <polyline
                  points={view.px.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="#A3F015" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"
                />
              )}
            {start && <circle cx={start.x} cy={start.y} r="7" fill="#43E9FF" stroke="#0B1220" strokeWidth="2.5" />}
          </svg>
          {end && (
            <div className="absolute text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" style={{ left: end.x - 3, top: end.y - 20 }}>
              <Icon name="sports_score" size={22} />
            </div>
          )}
          <div className="absolute bottom-1 right-1.5 text-[9px] text-slate-400/80 bg-ink-900/60 rounded px-1">
            © OpenStreetMap
          </div>
        </>
      )}
    </div>
  )
}
