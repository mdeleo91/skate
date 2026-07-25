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
// Calibrated against real pocket-carried skate data (2026-07): a stationary
// phone reads ~0.1–0.3, hand-carried walking ~2.2–2.9, and cruising ~9 mph
// on pavement that feels dead smooth underfoot reads ~3–5 — hard urethane
// transmits a lot of vibration even on good asphalt. The original 2.2
// boundary was set before any on-board data and called all of that rough.
// Above this per-fix RMS, pavement reads as rough chip-seal / bad asphalt.
export const ROUGH_RMS = 6.0
// Below this, it's glass — indoor floors, fresh asphalt at low speed.
const SMOOTH_FLOOR = 1.5
// Level 10 saturates here — beyond that it's all just gravel.
const ROUGH_MAX = 12.0

// 10-degree roughness scale. Levels 1–5 span the smooth range (≤ ROUGH_RMS),
// 6–10 the rough range, so the binary smooth/rough split sits exactly on the
// 5/6 boundary and the two views never disagree.
export function roughnessLevel(r) {
  if (r == null) return null
  if (r <= ROUGH_RMS) return Math.max(1, Math.ceil((r - SMOOTH_FLOOR) / ((ROUGH_RMS - SMOOTH_FLOOR) / 5)))
  return Math.min(10, 6 + Math.floor((r - ROUGH_RMS) / ((ROUGH_MAX - ROUGH_RMS) / 5)))
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
    if (v > ROUGH_RMS && v > SPIKE_RATIO * med) out[i] = null
  }

  return out
}

// ---- native series merge ---------------------------------------------------
// Replace live-stamped roughness with the native per-second series at save
// time. With the screen off the WebView throttles the plugin bridge, so the
// live path carries a stale RMS onto every fix (one value repeated for the
// whole pocket stretch); the native plugin keeps recording regardless. Each
// point gets the RMS of the samples between the previous fix and its own
// timestamp. A window with no samples means the sensor itself was suspended —
// the point gets no r at all, an honest gap rather than a stale echo.
export function mergeRoughnessSeries(route, entries) {
  if (!route?.length || !entries?.length) return route
  const sorted = [...entries].sort((a, b) => a.t - b.t)
  let j = 0
  return route.map((p, i) => {
    if (p.t == null) return p
    // Buckets are stamped at second-start, so one starting just before the
    // window still mostly covers it — reach back a second.
    const from = (i > 0 && route[i - 1].t != null ? route[i - 1].t : p.t - 3000) - 1000
    while (j < sorted.length && sorted[j].t < from) j++
    let sumSq = 0
    let n = 0
    for (let k = j; k < sorted.length && sorted[k].t <= p.t; k++) {
      sumSq += sorted[k].r * sorted[k].r * sorted[k].n
      n += sorted[k].n
    }
    if (!n) {
      const { r: _dropped, ...rest } = p
      return rest
    }
    return { ...p, r: +Math.sqrt(sumSq / n).toFixed(2) }
  })
}

// ---- raw roughness review (calibration) -----------------------------------
// Cleaned per-fix RMS as a time series plus its distribution numbers. This is
// the calibration view: the scale anchors above are only as good as the data
// behind them, so the app shows the raw m/s² per ride — match a stretch you
// remember against what it clocked, and when they disagree, the anchors move.
export function roughnessProfile(route) {
  const pts = route || []
  const rs = cleanRoughness(pts)
  const t0 = pts.find((p) => p.t != null)?.t
  if (t0 == null) return null
  const series = []
  for (let i = 0; i < pts.length; i++) {
    if (rs[i] == null || pts[i].t == null) continue
    const prev = i > 0 ? pts[i - 1] : null
    const dt = prev?.t != null ? (pts[i].t - prev.t) / 1000 : 0
    // Speed context per reading — vibration scales with speed, so a number
    // without the mph behind it can't be judged against how the road felt.
    const mph = prev && dt > 0 ? mphFromMps(distanceMeters(prev, pts[i]) / dt) : null
    series.push({ s: Math.round((pts[i].t - t0) / 1000), r: rs[i], mph: mph != null ? +mph.toFixed(1) : null })
  }
  if (series.length < 5) return null
  const sorted = series.map((p) => p.r).sort((a, b) => a - b)
  const q = (f) => sorted[Math.round(f * (sorted.length - 1))]
  return {
    series,
    durationSec: series[series.length - 1].s,
    median: +q(0.5).toFixed(2),
    p90: +q(0.9).toFixed(2),
    max: +q(1).toFixed(2),
  }
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
