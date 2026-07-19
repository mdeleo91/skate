import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import Icon from './icons'
import {
  TILE, lonToWorldX, latToWorldY, fitZoom, trackBounds, segmentSpeeds, speedColor, surfaceColor, cleanRoughness,
} from '../lib/track'

function tilesFor(originX, originY, width, height, z) {
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
  return tiles
}

// Street-tile map with a speed-colored route line. Tiles come from
// OpenStreetMap (free; attribution rendered below) and are CSS-filtered to
// match the app's dark theme. If tiles can't load (offline), the route still
// renders on the dark background — the data never depends on the imagery.
// colorBy: 'speed' (default) grades the line by pace; 'surface' grades it by
// accelerometer roughness — green smooth pavement, orange rough.
// Alternatively pass `paths` (array of point-arrays, e.g. a trail's disjoint
// segments) with optional parallel `pathColors` (per-point color or null) —
// used for trail geometry, coverage and roughness overlays.
export default function TrackMap({ points, paths, pathColors, height = 260, className = '', colorBy = 'speed' }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const allPoints = paths ? paths.flat() : points

  const view = useMemo(() => {
    if (!allPoints || allPoints.length < 2 || !width) return null
    const bounds = trackBounds(allPoints)
    const z = fitZoom(bounds, width, height)
    const cx = (lonToWorldX(bounds.minLon, z) + lonToWorldX(bounds.maxLon, z)) / 2
    const cy = (latToWorldY(bounds.minLat, z) + latToWorldY(bounds.maxLat, z)) / 2
    const originX = cx - width / 2
    const originY = cy - height / 2

    const toPx = (p) => ({
      x: lonToWorldX(p.lon, z) - originX,
      y: latToWorldY(p.lat, z) - originY,
    })

    let segs
    if (paths) {
      // Trail mode: each path drawn separately (no connectors between
      // disjoint segments), colored per point when pathColors is given.
      segs = []
      paths.forEach((path, si) => {
        const pp = path.map(toPx)
        for (let i = 1; i < path.length; i++) {
          segs.push({
            x1: pp[i - 1].x, y1: pp[i - 1].y, x2: pp[i].x, y2: pp[i].y,
            color: pathColors?.[si]?.[i] ?? pathColors?.[si]?.[i - 1] ?? '#2DD4BF',
          })
        }
      })
      const tiles = tilesFor(originX, originY, width, height, z)
      return { px: null, segs, tiles }
    }

    const px = points.map(toPx)
    if (colorBy === 'surface') {
      const rs = cleanRoughness(points) // frozen-sensor runs become honest gaps
      if (rs.some((v) => v != null)) {
        segs = points.slice(1).map((p, i) => ({
          x1: px[i].x, y1: px[i].y, x2: px[i + 1].x, y2: px[i + 1].y,
          color: surfaceColor(rs[i + 1] ?? rs[i]),
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

    return { px, segs, tiles: tilesFor(originX, originY, width, height, z) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, paths, pathColors, width, height, colorBy])

  if (!allPoints || allPoints.length < 2) {
    return (
      <div className={`grid place-items-center text-xs text-slate-500 rounded-xl bg-ink-700 ${className}`} style={{ height }}>
        No GPS trace for this session
      </div>
    )
  }

  const start = view?.px?.[0]
  const end = view?.px?.[view.px.length - 1]

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
              : view.px && (
                <polyline
                  points={view.px.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="#2DD4BF" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"
                />
              )}
            {start && <circle cx={start.x} cy={start.y} r="7" fill="#3B82F6" stroke="#0F172A" strokeWidth="2.5" />}
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
