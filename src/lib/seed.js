import { caloriesForSkate } from './calc'

const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().slice(0, 10)
}

const uid = () => Math.random().toString(36).slice(2, 10)

const SESSIONS = [
  { o: 0, typeId: 'outdoor-fitness', minutes: 48, miles: 7.2, top: 16.4, elev: 130, name: 'Riverfront Loop' },
  { o: 1, kind: 'strength', minutes: 30, name: 'Legs & Core' },
  { o: 2, typeId: 'commute', minutes: 22, miles: 3.1, top: 13.2, elev: 40, name: 'Ride to work' },
  { o: 3, typeId: 'recovery', minutes: 25, miles: 2.6, top: 9.1, elev: 15, name: 'Easy evening roll' },
  { o: 4, typeId: 'speed', minutes: 38, miles: 6.8, top: 22.7, elev: 60, name: 'Track intervals' },
  { o: 5, typeId: 'trail', minutes: 76, miles: 11.4, top: 17.9, elev: 420, name: 'Greenway North' },
  { o: 7, typeId: 'urban', minutes: 34, miles: 4.4, top: 15.0, elev: 90, name: 'Downtown Cruise' },
  { o: 8, kind: 'strength', minutes: 28, name: 'Hips & Glutes' },
  { o: 9, typeId: 'outdoor-fitness', minutes: 52, miles: 7.9, top: 16.9, elev: 145, name: 'Riverfront Loop' },
  { o: 11, typeId: 'trail', minutes: 95, miles: 13.6, top: 18.8, elev: 510, name: 'Greenway North' },
  { o: 12, typeId: 'freestyle', minutes: 40, name: 'Cone session at the park' },
  { o: 14, typeId: 'outdoor-fitness', minutes: 44, miles: 6.4, top: 15.7, elev: 120, name: 'Riverfront Loop' },
  { o: 15, kind: 'strength', minutes: 32, name: 'Full body' },
  { o: 17, typeId: 'hockey', minutes: 65, name: 'Pickup hockey' },
  { o: 18, typeId: 'commute', minutes: 24, miles: 3.1, top: 12.9, elev: 40, name: 'Ride to work' },
  { o: 20, typeId: 'trail', minutes: 68, miles: 9.8, top: 17.2, elev: 380, name: 'Lakeside Path' },
  { o: 22, typeId: 'outdoor-fitness', minutes: 40, miles: 5.7, top: 15.1, elev: 110, name: 'Neighborhood laps' },
  { o: 24, typeId: 'speed', minutes: 35, miles: 6.1, top: 21.4, elev: 55, name: 'Track intervals' },
  { o: 26, typeId: 'urban', minutes: 30, miles: 3.9, top: 14.4, elev: 85, name: 'Downtown Cruise' },
  { o: 28, typeId: 'outdoor-fitness', minutes: 36, miles: 5.0, top: 14.8, elev: 100, name: 'Neighborhood laps' },
]

// A tiny synthetic GPS trace so route detail views have something to draw.
function fakeRoute(miles, seedNum) {
  const pts = []
  const n = 40
  const baseLat = 39.7392 + (seedNum % 5) * 0.004
  const baseLon = -104.9903 - (seedNum % 7) * 0.004
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * Math.PI * 2
    pts.push({
      lat: baseLat + Math.sin(t) * 0.006 * (miles / 8) + Math.sin(t * 3) * 0.001,
      lon: baseLon + Math.cos(t) * 0.009 * (miles / 8) + Math.cos(t * 2) * 0.0012,
    })
  }
  return pts
}

export function seedWorkouts(weightLb = 192) {
  return SESSIONS.map((s, i) => {
    const kind = s.kind || 'skate'
    const miles = s.miles || 0
    const avg = miles ? +(miles / (s.minutes / 60)).toFixed(1) : 0
    const calories =
      kind === 'strength'
        ? Math.round(s.minutes * 6.2)
        : caloriesForSkate({ typeId: s.typeId, minutes: s.minutes, avgSpeedMph: avg, weightLb })
    return {
      id: uid(),
      date: day(s.o),
      kind,
      typeId: kind === 'skate' ? s.typeId : null,
      name: s.name,
      minutes: s.minutes,
      miles,
      avgSpeed: avg,
      topSpeed: s.top || 0,
      elevation: s.elev || 0,
      calories,
      laps: [],
      route: miles ? fakeRoute(miles, i) : [],
      source: 'seed',
    }
  })
}

export function seedWeights(start = 202, current = 192) {
  const out = []
  const weeks = 10
  for (let i = weeks; i >= 0; i--) {
    const progress = (weeks - i) / weeks
    const noise = (Math.sin(i * 2.7) + Math.cos(i * 1.3)) * 0.55
    const w = start - (start - current) * progress + noise
    out.push({
      id: uid(),
      date: day(i * 7),
      weightLb: +w.toFixed(1),
      bodyFat: +(28 - progress * 3.2 + noise * 0.2).toFixed(1),
      waist: +(38 - progress * 2.4).toFixed(1),
      hip: +(42 - progress * 1.6).toFixed(1),
      chest: +(43 - progress * 1.1).toFixed(1),
    })
  }
  return out
}

export function seedGear() {
  return [
    { id: uid(), cat: 'Boots', name: 'Powerslide Next 100', purchased: day(240), startMiles: 0, lifeMiles: 1500, notes: 'Main fitness boot', maintenance: [{ date: day(60), note: 'Replaced liner insoles' }] },
    { id: uid(), cat: 'Frames', name: '3x110 Trinity Frames', purchased: day(240), startMiles: 0, lifeMiles: 3000, notes: '', maintenance: [] },
    { id: uid(), cat: 'Wheels', name: 'Matter Juice 110mm 86A', purchased: day(70), startMiles: 0, lifeMiles: 400, notes: 'Rotate every ~100 mi', maintenance: [{ date: day(30), note: 'Rotated wheels' }] },
    { id: uid(), cat: 'Bearings', name: 'Bones Reds ABEC-7', purchased: day(240), startMiles: 0, lifeMiles: 1200, notes: '', maintenance: [{ date: day(45), note: 'Cleaned & re-lubed' }] },
    { id: uid(), cat: 'Protective Gear', name: 'Triple 8 Wrist Guards', purchased: day(240), startMiles: 0, lifeMiles: 2000, notes: 'Non-negotiable', maintenance: [] },
  ]
}

// A brand-new account. Physiology defaults exist only so the calorie formula has
// something to chew on before the user fills in Profile — but weight history,
// start weight and goal weight are deliberately null until the user logs them.
export function blankProfile(email) {
  return {
    name: email ? email.split('@')[0] : 'Skater',
    weightLb: 175,
    startWeightLb: null,
    goalWeightLb: null,
    heightIn: 70,
    age: 35,
    sex: 'male',
    activity: 1.45,
    weeklyLossLb: 1,
    waterGoalOz: 100,
    units: 'imperial',
  }
}
