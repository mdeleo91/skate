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

// 10-degree roughness scale. Levels 1–5 span the smooth range (≤ ROUGH_RMS),
// 6–10 the rough range, so the binary smooth/rough split sits exactly on the
// 5/6 boundary and the two views never disagree. Level 10 saturates at
// 6 m/s² — beyond that it's all just gravel.
export function roughnessLevel(r) {
  if (r == null) return null
  if (r <= ROUGH_RMS) return Math.max(1, Math.ceil((r - 0.6) / ((ROUGH_RMS - 0.6) / 5)))
  return Math.min(10, 6 + Math.floor((r - ROUGH_RMS) / ((6.0 - ROUGH_RMS) / 5)))
}

export function levelColor(level) {
  return `hsl(${150 - (level - 1) * (130 / 9)}, 85%, 55%)`
}

export function surfaceColor(r) {
  if (r == null) return '#64748b' // no data — neutral slate
  return levelColor(roughnessLevel(r))
}

// A frozen sensor used to leave the last live RMS stamped on every later
// point (screen-off suspend + a carry-forward bug). Real vibration never
// repeats to two decimals this many times in a row, so long identical runs
// are provably dead data — strip them so old skates read honestly.
const FROZEN_RUN = 6 // consecutive fixes can legitimately share one 1 Hz sample window; hundreds can't
const SPIKE_WINDOW = 5 // neighbors on each side used to judge a spike
const SPIKE_RATIO = 2.5 // a reading this far above the local median isn't pavement

export function cleanRoughness(route) {
  const pts = route || []
  const out = pts.map((p) => p.r)

  // Frozen runs: a dead sensor's last value carried forward.
  let start = 0
  for (let i = 1; i <= pts.length; i++) {
    if (i < pts.length && pts[i].r != null && pts[i].r === pts[start].r) continue
    if (pts[start].r != null && i - start >= FROZEN_RUN) {
      for (let j = start; j < i; j++) out[j] = null
    }
    start = i
  }

  // Spikes: pulling the phone from a pocket (or one hard jolt) reads as a
  // towering outlier against the surrounding pavement — drop it rather than
  // let a moment of handling paint the road rough. Judged against a snapshot
  // so earlier removals don't shift later medians.
  const base = out.slice()
  for (let i = 0; i < base.length; i++) {
    const v = base[i]
    if (v == null) continue
    const nb = []
    for (let j = Math.max(0, i - SPIKE_WINDOW); j <= Math.min(base.length - 1, i + SPIKE_WINDOW); j++) {
      if (j !== i && base[j] != null) nb.push(base[j])
    }
    if (nb.length < 3) continue
    const med = nb.sort((a, b) => a - b)[Math.floor(nb.length / 2)]
    if (v > 3 && v > SPIKE_RATIO * med) out[i] = null
  }

  return out
}

// Distribution across the 10 roughness levels — pct of sampled trace at each
// level, plus the average level. Null when there's too little data to mean much.
export function levelHistogram(route) {
  const rs = cleanRoughness(route).filter((v) => v != null)
  if (rs.length < 5) return null
  const counts = Array(10).fill(0)
  let sum = 0
  for (const v of rs) {
    const lv = roughnessLevel(v)
    counts[lv - 1]++
    sum += lv
  }
  return {
    pcts: counts.map((c) => Math.round((c / rs.length) * 100)),
    avg: +(sum / rs.length).toFixed(1),
  }
}

// Share of the trace with vibration data that reads rough vs smooth.
// coveragePct is how much of the route actually has vibration data — the
// rough/smooth split only describes that sampled slice, so low coverage
// means the split should be taken with a grain of salt (and labeled as such).
export function terrainStats(route) {
  const pts = route || []
  const rs = cleanRoughness(pts).filter((v) => v != null)
  if (rs.length < 5) return null
  const roughPct = Math.round((rs.filter((v) => v >= ROUGH_RMS).length / rs.length) * 100)
  return { roughPct, smoothPct: 100 - roughPct, coveragePct: Math.round((rs.length / pts.length) * 100) }
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
