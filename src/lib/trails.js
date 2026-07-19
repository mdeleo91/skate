import { distanceMeters } from './calc'

// Trail discovery via the Overpass API (OpenStreetMap's query engine).
// Free, no key, same dataset our map tiles draw. We ask for named, paved
// cycleways and multi-use paths near a point; OSM maps long trails as many
// short way-segments sharing one name, so grouping by name reassembles
// "Pinellas Trail" from its hundred pieces.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export async function fetchNearbyTrails(lat, lon, radiusMeters = 16000) {
  const around = `(around:${Math.round(radiusMeters)},${lat},${lon})`
  const q = `[out:json][timeout:25];
(
  way["highway"="cycleway"]["name"]${around};
  way["highway"~"^(path|footway|track)$"]["name"]["surface"~"^(paved|asphalt|concrete)$"]${around};
);
out tags geom 800;`

  let lastErr
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(q),
      })
      if (!res.ok) throw new Error(`Trail service unavailable (${res.status})`)
      const j = await res.json()
      return groupTrails(j.elements || [], lat, lon)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

function groupTrails(elements, lat, lon) {
  const here = { lat, lon }
  const groups = {}
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry?.length || !el.tags?.name) continue
    const g = (groups[el.tags.name] ??= {
      name: el.tags.name, surface: null, lengthM: 0, minDistM: Infinity, nearest: null, segments: [],
    })
    if (!g.surface && el.tags.surface) g.surface = el.tags.surface
    let prev = null
    const seg = []
    for (const p of el.geometry) {
      const pt = { lat: p.lat, lon: p.lon }
      if (prev) g.lengthM += distanceMeters(prev, pt)
      prev = pt
      seg.push(pt)
      const d = distanceMeters(here, pt)
      if (d < g.minDistM) {
        g.minDistM = d
        g.nearest = pt
      }
    }
    g.segments.push(seg)
  }
  return Object.values(groups)
    .filter((g) => g.lengthM > 400) // drop 100 m stubs that share a street name
    .sort((a, b) => a.minDistM - b.minDistM)
    .slice(0, 30)
}
