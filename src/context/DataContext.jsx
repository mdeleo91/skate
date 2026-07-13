import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedWorkouts, seedWeights, seedGear, blankProfile } from '../lib/seed'
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
//
// New accounts start completely EMPTY. No fake workouts, no fake weigh-ins, no fake
// gear. A first skate should be the user's first skate. Sample data is opt-in only,
// from Profile → Load sample data.
function emptyState(email) {
  return {
    version: 2,
    profile: blankProfile(email),
    workouts: [],    // { id, date, kind, typeId, name, minutes, miles, avgSpeed, topSpeed, elevation, calories, laps, route }
    meals: [],       // { id, date, slot, name, calories, protein, carbs, fat, fiber, sugar, sodium }
    water: {},       // { 'YYYY-MM-DD': ounces }
    weights: [],     // { id, date, weightLb, bodyFat, waist, hip, chest }
    photos: [],      // { id, date, view, dataUrl }
    savedMeals: [],  // { id, name, items: [] }
    favorites: [],   // food ids
    gear: [],        // { id, cat, name, purchased, lifeMiles, maintenance: [] }
    favoriteRoutes: [], // { id, name, cat }
    program: { activeId: null, startedAt: null, completed: [], doneDays: [] },
    challenges: { joined: [] },
    unlocked: [],
    isSample: false,
  }
}

// Opt-in demo dataset, clearly labeled in the UI so it's never mistaken for real history.
function sampleState(email) {
  const profile = { ...blankProfile(email), weightLb: 192, startWeightLb: 202, goalWeightLb: 175 }
  return {
    ...emptyState(email),
    profile,
    workouts: seedWorkouts(profile.weightLb),
    weights: seedWeights(202, 192),
    gear: seedGear(),
    challenges: { joined: ['w-15mi', 'm-100mi'] },
    isSample: true,
  }
}

const keyFor = (user) => `skate.data.${user?.id || 'anon'}`

// v1 accounts were auto-seeded with fake workouts, weigh-ins and gear at signup.
// Those are somebody's *fabricated* history sitting in a real account, so clear them —
// but never at the cost of anything the user actually logged. Seeded workouts are
// tagged source: 'seed', so real entries are easy to tell apart and always survive.
function migrate(saved, email) {
  if (!saved || (saved.version ?? 1) >= 2) return saved

  const realWorkouts = (saved.workouts || []).filter((w) => w.source !== 'seed')
  const userAddedSomething =
    realWorkouts.length > 0 ||
    (saved.meals || []).length > 0 ||
    (saved.photos || []).length > 0 ||
    (saved.savedMeals || []).length > 0

  // An untouched demo account: wipe it back to a clean first run, keeping only
  // the things the user could plausibly have set themselves.
  if (!userAddedSomething) {
    const fresh = emptyState(email)
    return {
      ...fresh,
      profile: { ...fresh.profile, name: saved.profile?.name || fresh.profile.name },
      water: saved.water || {},
    }
  }

  // They logged real sessions — keep every one, drop only the fabricated ones.
  return { ...saved, version: 2, workouts: realWorkouts, isSample: false }
}

// Nothing the user logged should die with the phone. For real (Supabase)
// accounts the whole state blob syncs to a per-user row: pulled and
// reconciled at sign-in, pushed (debounced) after every change. localStorage
// stays the source of truth for instant loads and offline use. Demo accounts
// remain local-only. Photos never sync — the app promises they stay on the
// device, and multi-megabyte images don't belong in every sync payload.
const cloudActive = (user) => isSupabaseConfigured && user && !user.demo

const isBlank = (s) => !s || (
  s.workouts.length === 0 && s.meals.length === 0 && s.weights.length === 0 &&
  s.gear.length === 0 && (s.savedMeals || []).length === 0
)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [sync, setSync] = useState({ status: 'idle', at: null })
  const pulledFor = useRef(null) // user id whose cloud state we've reconciled

  useEffect(() => {
    if (!user) {
      setState(null)
      pulledFor.current = null
      return
    }
    let local = null
    const raw = localStorage.getItem(keyFor(user))
    if (raw) {
      try { local = migrate(JSON.parse(raw), user.email) } catch { /* corrupt — treat as absent */ }
    }
    setState(local || emptyState(user.email))

    if (!cloudActive(user)) return
    let cancelled = false
    ;(async () => {
      setSync({ status: 'syncing', at: null })
      try {
        const { data: rows, error } = await supabase
          .from('skate_state')
          .select('data, updated_at')
          .eq('user_id', user.id)
          .limit(1)
        if (cancelled) return
        if (error) throw error
        const row = rows?.[0]
        const remote = row?.data ? migrate(row.data, user.email) : null
        const localStamp = local?.updatedAt ?? 0
        const remoteStamp = remote?.updatedAt ?? (row ? Date.parse(row.updated_at) : 0)

        pulledFor.current = user.id
        if (remote && (isBlank(local) || remoteStamp > localStamp)) {
          // Cloud wins — but photos are device-local, keep whatever is here.
          setState({ ...remote, photos: local?.photos || [] })
        } else {
          // Local wins (or cloud is empty): nudge state so the push effect
          // uploads it now that reconciliation is done.
          setState((s) => (s ? { ...s } : s))
        }
        setSync({ status: 'ok', at: Date.now() })
      } catch (e) {
        if (!cancelled) setSync({ status: 'error', at: null, detail: e?.message || '' })
      }
    })()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || !state) return
    localStorage.setItem(keyFor(user), JSON.stringify(state))
    if (!cloudActive(user)) return
    // Don't push until the sign-in pull has reconciled — otherwise a stale
    // local copy could briefly clobber a newer cloud row.
    if (pulledFor.current !== user.id) return
    const t = setTimeout(async () => {
      try {
        const { photos, ...cloudState } = state // photos stay on the device
        const { error } = await supabase.from('skate_state').upsert({
          user_id: user.id,
          data: cloudState,
          updated_at: new Date().toISOString(),
        })
        setSync(error
          ? { status: 'error', at: null, detail: error.message || '' }
          : { status: 'ok', at: Date.now() })
      } catch (e) {
        setSync({ status: 'error', at: null, detail: e?.message || '' })
      }
    }, 1500) // debounce: a burst of taps becomes one write
    return () => clearTimeout(t)
  }, [user, state])

  // Every mutation stamps updatedAt — it's how two devices decide who's newer.
  const update = useCallback((fn) => setState((s) => (s ? { ...fn(s), updatedAt: Date.now() } : s)), [])

  // ---- mutations ------------------------------------------------------
  const api = useMemo(() => ({
    setProfile: (patch) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } })),

    addWorkout: (w) => {
      const id = uid()
      update((s) => ({ ...s, workouts: [{ id, ...w }, ...s.workouts] }))
      return id
    },
    updateWorkout: (id, patch) => update((s) => ({
      ...s, workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    })),
    deleteWorkout: (id) => update((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) })),

    addMeal: (m) => update((s) => ({ ...s, meals: [{ id: uid(), date: todayISO(), ...m }, ...s.meals] })),
    updateMeal: (id, patch) => update((s) => ({
      ...s, meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
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
      const weights = [...rest, { id: uid(), ...entry, date }].sort((a, b) => a.date.localeCompare(b.date))
      return {
        ...s,
        weights,
        profile: {
          ...s.profile,
          weightLb: entry.weightLb ?? s.profile.weightLb,
          // The very first weigh-in becomes the starting weight — that's the line
          // everything else is measured from.
          startWeightLb: s.profile.startWeightLb ?? weights[0].weightLb,
        },
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

    loadSampleData: () => setState({ ...sampleState(user?.email), updatedAt: Date.now() }),
    clearAll: () => setState({ ...emptyState(user?.email), updatedAt: Date.now() }),
  }), [update, user])

  const derived = useMemo(() => (state ? computeDerived(state) : null), [state])

  const cloud = { enabled: cloudActive(user), ...sync }

  if (!state) return <DataCtx.Provider value={null}>{children}</DataCtx.Provider>
  return <DataCtx.Provider value={{ ...state, ...api, d: derived, cloud }}>{children}</DataCtx.Provider>
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

  // Weight is entirely optional. With zero weigh-ins every number here stays 0 or null —
  // never NaN, never Infinity, never a divide-by-zero.
  const weights = [...s.weights].sort((a, b) => a.date.localeCompare(b.date))
  const hasWeights = weights.length > 0
  const currentWeight = hasWeights ? weights[weights.length - 1].weightLb : null
  const startWeight = hasWeights ? (s.profile.startWeightLb ?? weights[0].weightLb) : null
  const goalWeight = s.profile.goalWeightLb ?? null
  const lbsLost = hasWeights ? Math.max(0, startWeight - currentWeight) : 0
  const goalTotal = hasWeights && goalWeight ? Math.max(1, startWeight - goalWeight) : 0
  const goalPct = goalTotal > 0 ? Math.min(100, Math.round((lbsLost / goalTotal) * 100)) : 0
  const weeksTracked = Math.max(1, weights.length - 1)
  const avgWeeklyLoss = weights.length > 1 ? +((startWeight - currentWeight) / weeksTracked).toFixed(2) : 0
  const lastWeek = weights.length > 1 ? +(weights[weights.length - 2].weightLb - currentWeight).toFixed(1) : 0

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
    weights, hasWeights, currentWeight, startWeight, goalWeight, lbsLost, goalPct, avgWeeklyLoss, lastWeek,
    bmiValue: hasWeights ? bmi(currentWeight, s.profile.heightIn) : null,
    prs, routes, metrics, unlocked, gear, activeProgram,
    activeDaysSet: new Set(activeDays),
    avgPace: totalMiles > 0 ? totalMinutes / totalMiles : 0,

    // First-run flags. Every surface uses these to decide between an empty state
    // and real content, so nothing ever renders a lonely "0.0" and calls it a dashboard.
    hasWorkouts: s.workouts.length > 0,
    hasSkates: skates.length > 0,
    hasMeals: s.meals.length > 0,
    hasMealsToday: todayMeals.length > 0,
    hasGear: s.gear.length > 0,
    hasPhotos: s.photos.length > 0,
    hasRoutes: routes.length > 0,
    isBrandNew: s.workouts.length === 0 && s.weights.length === 0 && s.meals.length === 0 && s.gear.length === 0,
  }
}
