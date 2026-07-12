import { distanceMeters, mphFromMps } from './calc'

// ---- per-segment speeds (for the speed-colored route line) ---------------
// route: [{ lat, lon, t? }] — t is a ms timestamp; older/manual sessions
// have no timestamps and fall back to a single-color line.
export function segmentSpeeds(route) {
  if (!route || route.length < 2 || route[0].t == null) return null
  const speeds = []
  for (let i = 1; i < route.length; i++) {
    const dm = distanceMeters(route[i - 1], route[i])
    const dt = (route[i].t - route[i - 1].t) / 1000
    speeds.push(dt > 0 ? mphFromMps(dm / dt) : 0)
  }
  // Light smoothing so GPS jitter doesn't turn the line into confetti.
  return speeds.map((_, i) => {
    const w = speeds.slice(Math.max(0, i - 2), i + 3)
    return w.reduce((a, v) => a + v, 0) / w.length
  })
}

// Speed → color, slow teal-green → fast ember. Matches the app palette.
export function speedColor(mph, min, max) {
  const span = max - min
  const t = span > 0.5 ? Math.max(0, Math.min(1, (mph - min) / span)) : 0.5
  const hue = 150 - t * 130 // 150 (green) → 20 (orange-red)
  return `hsl(${hue}, 85%, 55%)`
}

// ---- surface roughness (accelerometer vibration RMS, m/s²) ---------------
// Above this 1-second RMS, pavement reads as rough chip-seal / bad asphalt.
export const ROUGH_RMS = 2.2

export function surfaceColor(r) {
  if (r == null) return '#64748b' // no data — neutral slate
  const t = Math.max(0, Math.min(1, (r - 1) / 3)) // 1 m/s² smooth → 4 m/s² brutal
  const hue = 150 - t * 130
  return `hsl(${hue}, 85%, 55%)`
}

// Share of the trace with vibration data that reads rough vs smooth.
export function terrainStats(route) {
  const rs = (route || []).map((p) => p.r).filter((v) => v != null)
  if (rs.length < 5) return null
  const roughPct = Math.round((rs.filter((v) => v >= ROUGH_RMS).length / rs.length) * 100)
  return { roughPct, smoothPct: 100 - roughPct }
}

// ---- per-mile splits ------------------------------------------------------
// Returns [{ mile, seconds, mph, partial }] — the last entry may be a
// partial mile. Needs timestamps; returns [] without them.
export function computeSplits(route) {
  if (!route || route.length < 2 || route[0].t == null) return []
  const splits = []
  let acc = 0            // miles accumulated inside the current split
  let splitStart = route[0].t
  for (let i = 1; i < route.length; i++) {
    let prev = route[i - 1]
    const p = route[i]
    let dm = distanceMeters(prev, p) / 1609.344
    let dt = p.t - prev.t
    // A single GPS segment can cross one or more mile marks — interpolate.
    while (acc + dm >= 1) {
      const f = (1 - acc) / dm
      const tCross = prev.t + dt * f
      const seconds = (tCross - splitStart) / 1000
      splits.push({ mile: splits.length + 1, seconds, mph: seconds > 0 ? 3600 / seconds : 0, partial: false })
      splitStart = tCross
      dm -= (1 - acc)
      dt -= dt * f
      prev = { ...p, t: tCross } // remaining slice of this segment
      acc = 0
    }
    acc += dm
  }
  if (acc > 0.05) {
    const seconds = (route[route.length - 1].t - splitStart) / 1000
    splits.push({
      mile: splits.length + acc, seconds,
      mph: seconds > 0 ? (acc * 3600) / seconds : 0, partial: true, miles: acc,
    })
  }
  return splits
}

// ---- Web Mercator / slippy-map tiles -------------------------------------
export const TILE = 256

export function lonToWorldX(lon, z) {
  return ((lon + 180) / 360) * TILE * 2 ** z
}
export function latToWorldY(lat, z) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * TILE * 2 ** z
}

// Pick the highest zoom (≤ maxZoom) where the route bbox fits the viewport.
export function fitZoom(bounds, width, height, pad = 40, maxZoom = 17) {
  for (let z = maxZoom; z >= 1; z--) {
    const w = lonToWorldX(bounds.maxLon, z) - lonToWorldX(bounds.minLon, z)
    const h = latToWorldY(bounds.minLat, z) - latToWorldY(bounds.maxLat, z)
    if (w <= width - pad * 2 && h <= height - pad * 2) return z
  }
  return 1
}

export function trackBounds(route) {
  const lats = route.map((p) => p.lat)
  const lons = route.map((p) => p.lon)
  return {
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
    minLon: Math.min(...lons), maxLon: Math.max(...lons),
  }
}
