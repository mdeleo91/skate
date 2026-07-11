import { getSkateType } from './skateTypes'

export const KM_PER_MILE = 1.609344
export const LB_PER_KG = 2.20462

export const milesFromMeters = (m) => m / 1609.344
export const mphFromMps = (mps) => mps * 2.2369363

// Calories: MET model, scaled by how hard you were actually going.
// kcal/min = MET * 3.5 * kg / 200
export function caloriesForSkate({ typeId, minutes, avgSpeedMph = 0, weightLb = 175 }) {
  const type = getSkateType(typeId)
  const kg = weightLb / LB_PER_KG
  // Speed modifier: 10 mph is "baseline" fitness pace for GPS disciplines.
  let met = type.met
  if (type.gpsBased && avgSpeedMph > 0) {
    const ratio = avgSpeedMph / 10
    met = type.met * Math.min(1.6, Math.max(0.6, 0.55 + 0.45 * ratio + 0.12 * (ratio - 1)))
  }
  return Math.round(((met * 3.5 * kg) / 200) * Math.max(0, minutes))
}

export function bmi(weightLb, heightIn) {
  if (!weightLb || !heightIn) return null
  return (703 * weightLb) / (heightIn * heightIn)
}

export function bmiLabel(v) {
  if (v == null) return '—'
  if (v < 18.5) return 'Underweight'
  if (v < 25) return 'Healthy'
  if (v < 30) return 'Overweight'
  return 'Obese'
}

// Mifflin-St Jeor + activity, then a modest deficit that never goes below a floor.
export function calorieBudget(profile) {
  const { weightLb = 175, heightIn = 70, age = 35, sex = 'male', activity = 1.45, weeklyLossLb = 1 } = profile || {}
  const kg = weightLb / LB_PER_KG
  const cm = heightIn * 2.54
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === 'female' ? -161 : 5)
  const tdee = bmr * activity
  const deficit = (weeklyLossLb * 3500) / 7
  const floor = sex === 'female' ? 1300 : 1550
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(Math.max(floor, tdee - deficit)),
  }
}

export function macroTargets(targetCalories, profile) {
  const weightLb = profile?.weightLb || 175
  const protein = Math.round(Math.max(90, weightLb * 0.8)) // g
  const fat = Math.round((targetCalories * 0.28) / 9)
  const carbs = Math.round(Math.max(0, (targetCalories - protein * 4 - fat * 9) / 4))
  return { protein, carbs, fat, fiber: 30, sugar: 45, sodium: 2300 }
}

// Haversine, meters
export function distanceMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function fmtDuration(sec) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${m}:${String(ss).padStart(2, '0')}`
}

export function fmtPace(minutes, miles) {
  if (!miles || miles < 0.05) return '—'
  const pace = minutes / miles
  const m = Math.floor(pace)
  const s = Math.round((pace - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /mi`
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const isoDay = (d) => new Date(d).toISOString().slice(0, 10)

export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

// Streak = consecutive days (ending today or yesterday) with any activity.
export function computeStreak(activeDays) {
  const set = new Set(activeDays)
  let streak = 0
  const d = new Date()
  if (!set.has(isoDay(d))) d.setDate(d.getDate() - 1)
  while (set.has(isoDay(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function longestStreak(activeDays) {
  const days = [...new Set(activeDays)].sort()
  let best = 0
  let cur = 0
  let prev = null
  for (const day of days) {
    if (prev && daysBetween(prev, day) === 1) cur++
    else cur = 1
    prev = day
    if (cur > best) best = cur
  }
  return best
}
