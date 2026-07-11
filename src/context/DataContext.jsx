import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { seedWorkouts, seedWeights, seedGear, seedProfile } from '../lib/seed'
import {
  calorieBudget, macroTargets, computeStreak, longestStreak, todayISO, isoDay, bmi,
} from '../lib/calc'
import { PROGRAMS } from '../lib/programs'
import { ACHIEVEMENTS } from '../lib/achievements'

const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

const uid = () => Math.random().toString(36).slice(2, 10)

// Each collection is shaped like a future Supabase table row (id, user_id, date, ...)
// so migrating from localStorage to Postgres is a mapping exercise, not a rewrite.
function emptyState(email) {
  return {
    version: 1,
    profile: seedProfile(email),
    workouts: seedWorkouts(),
    meals: [],       // { id, date, slot, name, calories, protein, carbs, fat, fiber, sugar, sodium }
    water: {},       // { 'YYYY-MM-DD': ounces }
    weights: seedWeights(),
    photos: [],      // { id, date, view, dataUrl }
    savedMeals: [],  // { id, name, items: [] }
    favorites: [],   // food ids
    gear: seedGear(),
    favoriteRoutes: [], // { id, name, cat }
    program: { activeId: null, startedAt: null, completed: [], doneDays: [] },
    challenges: { joined: ['w-15mi', 'm-100mi'] },
    unlocked: [],
  }
}

const keyFor = (user) => `skate.data.${user?.id || 'anon'}`

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(null)

  useEffect(() => {
    if (!user) return setState(null)
    const raw = localStorage.getItem(keyFor(user))
    if (raw) {
      try {
        setState(JSON.parse(raw))
        return
      } catch { /* fall through to fresh seed */ }
    }
    setState(emptyState(user.email))
  }, [user])

  useEffect(() => {
    if (user && state) localStorage.setItem(keyFor(user), JSON.stringify(state))
  }, [user, state])

  const update = useCallback((fn) => setState((s) => (s ? fn(s) : s)), [])

  // ---- mutations ------------------------------------------------------
  const api = useMemo(() => ({
    setProfile: (patch) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } })),

    addWorkout: (w) => update((s) => ({ ...s, workouts: [{ id: uid(), ...w }, ...s.workouts] })),
    deleteWorkout: (id) => update((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) })),

    addMeal: (m) => update((s) => ({ ...s, meals: [{ id: uid(), date: todayISO(), ...m }, ...s.meals] })),
    deleteMeal: (id) => update((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) })),
    saveMeal: (name, items) => update((s) => ({ ...s, savedMeals: [{ id: uid(), name, items }, ...s.savedMeals] })),
    toggleFavorite: (foodId) => update((s) => ({
      ...s,
      favorites: s.favorites.includes(foodId) ? s.favorites.filter((f) => f !== foodId) : [foodId, ...s.favorites],
    })),

    addWater: (oz, date = todayISO()) => update((s) => ({
      ...s, water: { ...s.water, [date]: Math.max(0, (s.water[date] || 0) + oz) },
    })),

    addWeight: (entry) => update((s) => {
      const date = entry.date || todayISO()
      const rest = s.weights.filter((w) => w.date !== date)
      return {
        ...s,
        weights: [...rest, { id: uid(), ...entry, date }].sort((a, b) => a.date.localeCompare(b.date)),
        profile: { ...s.profile, weightLb: entry.weightLb ?? s.profile.weightLb },
      }
    }),
    deleteWeight: (id) => update((s) => ({ ...s, weights: s.weights.filter((w) => w.id !== id) })),

    addPhoto: (photo) => update((s) => ({ ...s, photos: [{ id: uid(), date: todayISO(), ...photo }, ...s.photos] })),
    deletePhoto: (id) => update((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) })),

    addGear: (g) => update((s) => ({ ...s, gear: [{ id: uid(), maintenance: [], startMiles: 0, ...g }, ...s.gear] })),
    deleteGear: (id) => update((s) => ({ ...s, gear: s.gear.filter((g) => g.id !== id) })),
    logMaintenance: (id, note) => update((s) => ({
      ...s,
      gear: s.gear.map((g) => (g.id === id
        ? { ...g, maintenance: [{ date: todayISO(), note }, ...(g.maintenance || [])] }
        : g)),
    })),
    resetGearMileage: (id) => update((s) => ({
      ...s,
      gear: s.gear.map((g) => (g.id === id ? { ...g, startMiles: 0, purchased: todayISO() } : g)),
    })),

    toggleFavoriteRoute: (name, cat) => update((s) => {
      const exists = s.favoriteRoutes.find((r) => r.name === name)
      return {
        ...s,
        favoriteRoutes: exists
          ? s.favoriteRoutes.filter((r) => r.name !== name)
          : [{ id: uid(), name, cat: cat || 'Favorite' }, ...s.favoriteRoutes],
      }
    }),

    startProgram: (id) => update((s) => ({
      ...s, program: { ...s.program, activeId: id, startedAt: todayISO(), doneDays: [] },
    })),
    leaveProgram: () => update((s) => ({ ...s, program: { ...s.program, activeId: null, startedAt: null } })),
    toggleProgramDay: (key) => update((s) => ({
      ...s,
      program: {
        ...s.program,
        doneDays: s.program.doneDays.includes(key)
          ? s.program.doneDays.filter((d) => d !== key)
          : [...s.program.doneDays, key],
      },
    })),
    completeProgram: (id) => update((s) => ({
      ...s,
      program: { ...s.program, activeId: null, completed: [...new Set([...s.program.completed, id])] },
    })),

    toggleChallenge: (id) => update((s) => ({
      ...s,
      challenges: {
        joined: s.challenges.joined.includes(id)
          ? s.challenges.joined.filter((c) => c !== id)
          : [...s.challenges.joined, id],
      },
    })),

    resetAll: () => setState(emptyState(user?.email)),
  }), [update, user])

  const derived = useMemo(() => (state ? computeDerived(state) : null), [state])

  if (!state) return <DataCtx.Provider value={null}>{children}</DataCtx.Provider>
  return <DataCtx.Provider value={{ ...state, ...api, d: derived }}>{children}</DataCtx.Provider>
}

// ---- derived stats ----------------------------------------------------
function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
  return isoDay(d)
}
function startOfMonth() {
  const d = new Date()
  return isoDay(new Date(d.getFullYear(), d.getMonth(), 1))
}

function computeDerived(s) {
  const today = todayISO()
  const skates = s.workouts.filter((w) => w.kind === 'skate')
  const totalMiles = skates.reduce((a, w) => a + (w.miles || 0), 0)
  const totalMinutes = s.workouts.reduce((a, w) => a + (w.minutes || 0), 0)
  const totalCalories = s.workouts.reduce((a, w) => a + (w.calories || 0), 0)
  const activeDays = s.workouts.map((w) => w.date)
  const streak = computeStreak(activeDays)
  const bestStreak = longestStreak(activeDays)

  const budget = calorieBudget(s.profile)
  const macros = macroTargets(budget.target, s.profile)

  const todayMeals = s.meals.filter((m) => m.date === today)
  const consumed = todayMeals.reduce((a, m) => a + (m.calories || 0), 0)
  const burned = s.workouts.filter((w) => w.date === today).reduce((a, w) => a + (w.calories || 0), 0)
  const macrosToday = ['protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'].reduce((acc, k) => {
    acc[k] = Math.round(todayMeals.reduce((a, m) => a + (m[k] || 0), 0))
    return acc
  }, {})

  const activeMinutesToday = s.workouts.filter((w) => w.date === today).reduce((a, w) => a + w.minutes, 0)
  const milesToday = s.workouts.filter((w) => w.date === today && w.kind === 'skate').reduce((a, w) => a + (w.miles || 0), 0)

  const wk = startOfWeek()
  const mo = startOfMonth()
  const weekWorkouts = s.workouts.filter((w) => w.date >= wk)
  const monthWorkouts = s.workouts.filter((w) => w.date >= mo)

  const weights = [...s.weights].sort((a, b) => a.date.localeCompare(b.date))
  const currentWeight = weights.length ? weights[weights.length - 1].weightLb : s.profile.weightLb
  const startWeight = s.profile.startWeightLb || (weights[0]?.weightLb ?? currentWeight)
  const lbsLost = Math.max(0, startWeight - currentWeight)
  const goalTotal = Math.max(1, startWeight - (s.profile.goalWeightLb || startWeight))
  const goalPct = Math.min(100, Math.round((lbsLost / goalTotal) * 100))
  const weeksTracked = Math.max(1, weights.length - 1)
  const avgWeeklyLoss = +(((startWeight - currentWeight) / weeksTracked)).toFixed(2)
  const lastWeek = weights.length > 1 ? weights[weights.length - 2].weightLb - currentWeight : 0

  const prs = {
    longestDistance: Math.max(0, ...skates.map((w) => w.miles || 0)),
    fastestAvg: Math.max(0, ...skates.map((w) => w.avgSpeed || 0)),
    fastestTop: Math.max(0, ...skates.map((w) => w.topSpeed || 0)),
    longestWorkout: Math.max(0, ...s.workouts.map((w) => w.minutes || 0)),
    mostCalories: Math.max(0, ...s.workouts.map((w) => w.calories || 0)),
    longestStreak: bestStreak,
  }

  // Routes: group skates by name
  const routeMap = {}
  for (const w of skates) {
    if (!w.name) continue
    const r = routeMap[w.name] || { name: w.name, count: 0, bestMiles: 0, bestAvg: 0, lastDate: '', totalMiles: 0, elevation: 0 }
    r.count++
    r.totalMiles += w.miles || 0
    r.bestMiles = Math.max(r.bestMiles, w.miles || 0)
    r.bestAvg = Math.max(r.bestAvg, w.avgSpeed || 0)
    r.elevation = Math.max(r.elevation, w.elevation || 0)
    if (w.date > r.lastDate) r.lastDate = w.date
    routeMap[w.name] = r
  }
  const routes = Object.values(routeMap).sort((a, b) => b.count - a.count)

  const daysActive = activeDays.length
    ? Math.max(1, Math.round((new Date(today) - new Date([...activeDays].sort()[0])) / 86400000) + 1)
    : 0

  const metrics = {
    miles: totalMiles,
    calories: totalCalories,
    workouts: s.workouts.length,
    daysActive,
    lbsLost,
    goalPct,
    streak,
    weekMiles: weekWorkouts.filter((w) => w.kind === 'skate').reduce((a, w) => a + (w.miles || 0), 0),
    weekCalories: weekWorkouts.reduce((a, w) => a + (w.calories || 0), 0),
    weekStrength: weekWorkouts.filter((w) => w.kind === 'strength').length,
    weekWaterDays: Object.entries(s.water).filter(([d, oz]) => d >= wk && oz >= (s.profile.waterGoalOz || 100)).length,
    monthMiles: monthWorkouts.filter((w) => w.kind === 'skate').reduce((a, w) => a + (w.miles || 0), 0),
    monthProgramPct: s.program.activeId
      ? Math.min(100, Math.round((s.program.doneDays.length / 28) * 100))
      : 0,
    programsCompleted: s.program.completed.length,
  }

  const unlocked = ACHIEVEMENTS.filter((a) => (metrics[a.metric] ?? 0) >= a.goal).map((a) => a.id)

  // Gear mileage: miles skated since each item's purchase date.
  const gear = s.gear.map((g) => {
    const miles = skates
      .filter((w) => !g.purchased || w.date >= g.purchased)
      .reduce((a, w) => a + (w.miles || 0), 0) + (g.startMiles || 0)
    const pct = g.lifeMiles ? Math.min(100, Math.round((miles / g.lifeMiles) * 100)) : 0
    return { ...g, miles: +miles.toFixed(1), pct, remaining: Math.max(0, (g.lifeMiles || 0) - miles) }
  })

  const activeProgram = s.program.activeId ? PROGRAMS.find((p) => p.id === s.program.activeId) : null

  return {
    today, skates, totalMiles, totalMinutes, totalCalories, streak, bestStreak,
    budget, macros, macrosToday, consumed, burned,
    remaining: budget.target - consumed + burned,
    activeMinutesToday, milesToday,
    waterToday: s.water[today] || 0,
    weights, currentWeight, startWeight, lbsLost, goalPct, avgWeeklyLoss, lastWeek,
    bmiValue: bmi(currentWeight, s.profile.heightIn),
    prs, routes, metrics, unlocked, gear, activeProgram,
    activeDaysSet: new Set(activeDays),
    avgPace: totalMiles > 0 ? totalMinutes / totalMiles : 0,
  }
}
