import { distanceMeters } from './calc'
import { cleanRoughness, roughnessLevel } from './track'

// Geometry glue between OSM trails and the user's own GPS recordings:
// which parts of a trail they've skated, how rough each stretch read,
// which trail a session was on, and where to turn around for a target
// distance. Everything works on downsampled point lists and a coarse
// spatial hash, so it stays cheap enough to run on every render (memoized).

export const NEAR_M = 60 // GPS point within this of a trail point = "on the trail"

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Cut a trail's geometry down for storage/sync — ~25-50 m point spacing is
// plenty for maps, matching and distance math.
export function downsampleSegments(segments, maxPts = 1200) {
  const total = segments.reduce((a, s) => a + s.length, 0)
  const step = Math.max(1, Math.ceil(total / maxPts))
  return segments.map((seg) =>
    seg.filter((_, i) => i % step === 0 || i === seg.length - 1)
  ).filter((seg) => seg.length >= 2)
}

// ---- spatial hash over workout GPS points ---------------------------------
const CELL = 0.0008 // ~80 m of latitude — one lookup ring covers NEAR_M

function cellKey(lat, lon) {
  return `${Math.round(lat / CELL)}:${Math.round(lon / CELL)}`
}

// Index every GPS point of every workout that has a route. Values keep a
// back-reference to the workout and the point's cleaned roughness.
export function buildFixIndex(workouts) {
  const index = new Map()
  for (const w of workouts || []) {
    if (!w.route || w.route.length < 2) continue
    const rs = cleanRoughness(w.route)
    for (let i = 0; i < w.route.length; i++) {
      const p = w.route[i]
      const key = cellKey(p.lat, p.lon)
      let arr = index.get(key)
      if (!arr) index.set(key, (arr = []))
      arr.push({ lat: p.lat, lon: p.lon, r: rs[i], wid: w.id })
    }
  }
  return index
}

function nearbyFixes(index, pt) {
  const cy = Math.round(pt.lat / CELL)
  const cx = Math.round(pt.lon / CELL)
  const out = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const arr = index.get(`${cy + dy}:${cx + dx}`)
      if (arr) out.push(...arr)
    }
  }
  return out
}

// ---- coverage + roughness along a trail -----------------------------------
// Returns { pct, covered: [[bool,...] per segment], levels: [[lvl|null,...]],
//           workoutIds: Set, smoothest: {avgLevel, lengthM, midpoint} | null }
export function trailCoverage(trail, workouts) {
  const index = buildFixIndex(workouts)
  const covered = []
  const levels = []
  const workoutIds = new Set()
  let coveredCount = 0
  let total = 0

  for (const seg of trail.segments) {
    const cFlags = []
    const lvls = []
    for (const pt of seg) {
      total++
      let isCovered = false
      let rSum = 0
      let rN = 0
      for (const f of nearbyFixes(index, pt)) {
        if (distanceMeters(f, pt) <= NEAR_M) {
          isCovered = true
          workoutIds.add(f.wid)
          if (f.r != null) { rSum += f.r; rN++ }
        }
      }
      if (isCovered) coveredCount++
      cFlags.push(isCovered)
      lvls.push(rN > 0 ? roughnessLevel(rSum / rN) : null)
    }
    covered.push(cFlags)
    levels.push(lvls)
  }

  // Smoothest sustained stretch: sliding window (~1 mile) over each segment's
  // measured levels, ignoring unmeasured points.
  let smoothest = null
  trail.segments.forEach((seg, si) => {
    const lvls = levels[si]
    let dist = 0
    const cum = [0]
    for (let i = 1; i < seg.length; i++) {
      dist += distanceMeters(seg[i - 1], seg[i])
      cum.push(dist)
    }
    const WINDOW_M = 1600
    for (let a = 0; a < seg.length; a++) {
      if (lvls[a] == null) continue
      let sum = 0, n = 0, b = a
      while (b < seg.length && cum[b] - cum[a] <= WINDOW_M) {
        if (lvls[b] != null) { sum += lvls[b]; n++ }
        b++
      }
      const lengthM = cum[Math.min(b, seg.length) - 1] - cum[a]
      if (n >= 8 && lengthM >= 800) {
        const avg = sum / n
        if (!smoothest || avg < smoothest.avgLevel) {
          smoothest = { avgLevel: +avg.toFixed(1), lengthM, midpoint: seg[Math.floor((a + b) / 2)] }
        }
      }
    }
  })

  return {
    pct: total > 0 ? Math.round((coveredCount / total) * 100) : 0,
    covered,
    levels,
    workoutIds,
    smoothest,
  }
}

// Which saved trail was this route skated on? Sampled containment test.
export function matchRouteToTrails(route, trails) {
  if (!route || route.length < 10 || !trails?.length) return null
  let best = null
  for (const trail of trails) {
    const index = buildFixIndex([{ id: 't', route: trail.segments.flat() }])
    const step = Math.max(1, Math.floor(route.length / 80))
    let hits = 0
    let n = 0
    for (let i = 0; i < route.length; i += step) {
      n++
      const pt = route[i]
      if (nearbyFixes(index, pt).some((f) => distanceMeters(f, pt) <= NEAR_M)) hits++
    }
    const frac = n > 0 ? hits / n : 0
    if (frac >= 0.5 && (!best || frac > best.frac)) best = { trail, frac }
  }
  return best?.trail ?? null
}

// ---- orientation + wind ---------------------------------------------------
// Dominant axis of the trail: bearing between its two farthest endpoints.
export function trailBearing(segments) {
  const ends = segments.flatMap((s) => [s[0], s[s.length - 1]])
  let a = null, b = null, maxD = 0
  for (let i = 0; i < ends.length; i++) {
    for (let j = i + 1; j < ends.length; j++) {
      const d = distanceMeters(ends[i], ends[j])
      if (d > maxD) { maxD = d; a = ends[i]; b = ends[j] }
    }
  }
  if (!a) return null
  const toRad = (x) => (x * Math.PI) / 180
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon))
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

export function compass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8]
}

// Wind blows FROM windFromDeg. Best plan: start INTO the wind, come home with
// it. Returns advice or null for calm / pure crosswind.
export function windPlan(bearingDeg, windFromDeg, windMph) {
  if (bearingDeg == null || windFromDeg == null || windMph < 6) return null
  const angDist = (a, b) => {
    const d = Math.abs(((a - b) % 360 + 360) % 360)
    return Math.min(d, 360 - d)
  }
  const alongness = Math.min(angDist(bearingDeg, windFromDeg), 180 - angDist(bearingDeg, windFromDeg))
  if (alongness > 55) return { cross: true }
  // Which end of the trail's axis points into the wind?
  const upwind = angDist(bearingDeg, windFromDeg) <= 90 ? bearingDeg : (bearingDeg + 180) % 360
  return { cross: false, startHeading: compass(upwind) }
}

// ---- out-and-back planner -------------------------------------------------
// Walk the trail's longest segment from the point nearest `from`; turn around
// at half the target distance. Returns the turnaround point + achievable total.
export function outAndBack(trail, targetMiles, from) {
  const seg = [...trail.segments].sort((a, b) => b.length - a.length)[0]
  if (!seg || seg.length < 2) return null
  const cum = [0]
  for (let i = 1; i < seg.length; i++) cum.push(cum[i - 1] + distanceMeters(seg[i - 1], seg[i]))
  let entryIdx = 0
  if (from) {
    let bestD = Infinity
    seg.forEach((p, i) => {
      const d = distanceMeters(p, from)
      if (d < bestD) { bestD = d; entryIdx = i }
    })
  }
  const half = (targetMiles * 1609.344) / 2
  const ahead = cum[cum.length - 1] - cum[entryIdx]
  const behind = cum[entryIdx]
  const dir = ahead >= behind ? 1 : -1
  const avail = dir === 1 ? ahead : behind
  const want = Math.min(half, avail)
  let idx = entryIdx
  while (idx > 0 && idx < seg.length - 1 && Math.abs(cum[idx] - cum[entryIdx]) < want) idx += dir
  return {
    turnaround: seg[idx],
    totalMiles: +((Math.abs(cum[idx] - cum[entryIdx]) * 2) / 1609.344).toFixed(1),
    limited: avail < half,
  }
}
