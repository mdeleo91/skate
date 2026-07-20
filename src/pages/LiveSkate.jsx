import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { getSkateType } from '../lib/skateTypes'
import { caloriesForSkate, distanceMeters, milesFromMeters, mphFromMps, fmtDuration, todayISO } from '../lib/calc'
import { ROUGH_RMS, cleanRoughness } from '../lib/track'
import { matchRouteToTrails } from '../lib/trailMatch'
import { isNativeApp, startLocationWatch, Roughness } from '../lib/geo'
import { dlog } from '../lib/debugLog'
import { RouteMap, Modal } from '../components/ui'
import Icon from '../components/icons'

const BIG = 'font-display font-bold tabular-nums text-white leading-none'
const MOVING_MPH = 1.5 // below this you're standing at a crosswalk, not skating

export default function LiveSkate() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const data = useData()
  const typeId = params.get('type') || 'outdoor-fitness'
  const type = getSkateType(typeId)
  const presetTrailId = params.get('trail')
  const presetName = params.get('name')

  const [status, setStatus] = useState('idle') // idle | running | paused | done
  const [mode, setMode] = useState(null)       // 'gps' | 'demo'
  const [gpsError, setGpsError] = useState(null)
  const [meters, setMeters] = useState(0)
  const [speed, setSpeed] = useState(0)        // mph
  const [topSpeed, setTopSpeed] = useState(0)
  const [elevation, setElevation] = useState(0) // ft gained
  const [hr, setHr] = useState(null)
  const [surface, setSurface] = useState(null) // null | 'smooth' | 'rough'
  const [points, setPoints] = useState([])
  const [laps, setLaps] = useState([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState(presetName || '')
  const [, setNowTick] = useState(0) // 1 Hz re-render while running

  const watcher = useRef(null)      // { stop } from startLocationWatch
  const statusRef = useRef('idle')
  const speedRef = useRef(0)
  const lastFix = useRef(null)      // { lat, lon, t } of last accepted GPS fix
  const altSmooth = useRef(null)    // EMA-smoothed altitude (m)
  const altBase = useRef(null)      // lowest smoothed altitude since last committed gain
  const baroAlt = useRef(null)      // barometric altitude (m, uncalibrated)
  const baroAt = useRef(0)          // when the last pressure reading arrived
  const baroOffset = useRef(null)   // slow-tracked (GPS − baro) so baro sits on the GPS scale
  const demoRef = useRef({ t: 0 })
  const startedAt = useRef(null)
  const hrSamples = useRef([])
  const motionBuf = useRef([])
  const motionSeen = useRef(false)
  const motionSamples = useRef(null)    // samples in the last native read (debug log)
  const motionReadFailed = useRef(false)
  const roughRms = useRef(null)
  const motionHandler = useRef(null)
  const wakeLock = useRef(null)

  // Time is wall-clock, not counted timer ticks: browsers throttle timers
  // when the screen is off or the tab is hidden, but Date.now() and GPS fix
  // timestamps never lie. This is what keeps totals honest in the APK when
  // the phone is asleep and only the location service is feeding us.
  const startTs = useRef(null)   // ms when tracking started
  const pausedMs = useRef(0)     // accumulated paused time
  const pauseStart = useRef(null)
  const doneAt = useRef(null)
  const movingMs = useRef(0)     // accumulated moving time

  statusRef.current = status
  speedRef.current = speed

  function elapsedSec() {
    if (startTs.current == null) return 0
    const end = doneAt.current ?? pauseStart.current ?? Date.now()
    return Math.max(0, Math.floor((end - startTs.current - pausedMs.current) / 1000))
  }
  const elapsed = elapsedSec()
  const movingSec = Math.floor(movingMs.current / 1000)
  const stoppedSec = Math.max(0, elapsed - movingSec)

  const weightLb = data?.profile?.weightLb || 175
  const miles = milesFromMeters(meters)
  // Averages and calories use MOVING time — waiting at a light isn't skating.
  const movingMin = movingSec / 60
  const avgSpeed = movingMin > 0 ? miles / (movingMin / 60) : 0
  const calories = caloriesForSkate({ typeId, minutes: movingMin, avgSpeedMph: avgSpeed, weightLb })

  // ---- 1 Hz UI tick + roughness sample --------------------------------------
  useEffect(() => {
    if (status !== 'running') return
    const i = setInterval(() => {
      setNowTick((n) => n + 1)
      const buf = motionBuf.current
      if (Roughness && mode === 'gps') {
        // Native sampling: roughRms is refreshed per GPS fix; just drive the chip.
        const r = roughRms.current
        setSurface(r != null && speedRef.current >= MOVING_MPH ? (r >= ROUGH_RMS ? 'rough' : 'smooth') : null)
      } else if (buf.length > 3) {
        const rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length)
        roughRms.current = +rms.toFixed(2)
        setSurface(speedRef.current >= MOVING_MPH ? (rms >= ROUGH_RMS ? 'rough' : 'smooth') : null)
      } else if (mode === 'gps') {
        roughRms.current = null
        if (!motionSeen.current) setSurface(null)
      }
      motionBuf.current = []
    }, 1000)
    return () => clearInterval(i)
  }, [status, mode])

  // ---- GPS -------------------------------------------------------------------
  const handlePosition = useCallback((pos) => {
    if (statusRef.current !== 'running') return // paused: freeze everything
    // Drain the native vibration buffer once per fix. Fire-and-forget keeps
    // point ordering synchronous — this fix carries the previous window's RMS
    // (a one-fix lag), the next fix gets this stretch of pavement.
    if (Roughness) {
      Roughness.read()
        .then(({ rms, samples, pressure, pressureSamples }) => {
          motionSamples.current = samples
          if (pressureSamples > 0 && pressure > 0) {
            // Standard atmosphere: pressure → altitude. Absolute value is off
            // by the day's weather, but deltas are accurate to ~0.3 m — the
            // GPS-tracked offset below puts it on the right absolute scale.
            baroAlt.current = 44330 * (1 - Math.pow(pressure / 1013.25, 1 / 5.255))
            baroAt.current = Date.now()
          }
          if (samples > 3 && rms >= 0) {
            if (roughRms.current == null) dlog('motion:live', { samples }, { critical: true })
            roughRms.current = +rms.toFixed(2)
          } else if (roughRms.current != null) {
            // Sensor stalled (screen-off suspend). A gap in the data is the
            // truth; carrying the last value forward painted a frozen fake.
            roughRms.current = null
            dlog('motion:stalled', { samples }, { critical: true })
          }
        })
        .catch((e) => {
          roughRms.current = null
          if (!motionReadFailed.current) {
            motionReadFailed.current = true
            dlog('motion:read-error', String(e?.message ?? e).slice(0, 200), { critical: true })
          }
        })
    }
    const { latitude: lat, longitude: lon, altitude, speed: mps, accuracy } = pos.coords
    if (accuracy && accuracy > 50) {
      dlog('fix:rejected', { acc: Math.round(accuracy) })
      return // ignore garbage fixes
    }
    const t = pos.timestamp || Date.now()
    const p = { lat, lon, t, r: roughRms.current ?? undefined }
    // One compact entry per fix — accuracy, speed, vibration RMS and how many
    // accelerometer samples fed it. This is the data that shows sensor
    // throttling or a mid-skate death in the debug log.
    dlog('fix', {
      acc: accuracy != null ? Math.round(accuracy) : undefined,
      mph: mps != null ? +mphFromMps(mps).toFixed(1) : undefined,
      r: roughRms.current ?? undefined,
      n: motionSamples.current ?? undefined,
      // Uncalibrated barometric altitude (m) — for elevation tuning.
      ba: baroAlt.current != null ? +baroAlt.current.toFixed(1) : undefined,
    })

    let mph = null
    let dtSec = null
    if (lastFix.current) {
      const dm = distanceMeters(lastFix.current, p)
      dtSec = (t - lastFix.current.t) / 1000
      if (dm > 1 && dm < 120) {
        setMeters((m) => m + dm)
        // Some phones never report coords.speed in the browser — derive it
        // from consecutive fixes so the speedometer works everywhere.
        if (dtSec > 0.4) mph = mphFromMps(dm / dtSec)
      }
    }
    if (mps != null && mps >= 0) mph = mphFromMps(mps)
    if (mph != null && mph < 45) { // >45 mph on skates is a GPS teleport, not you
      setSpeed(mph)
      speedRef.current = mph
      setTopSpeed((v) => Math.max(v, mph))
    }
    // Moving time accrues from fix-to-fix gaps, so it stays correct even when
    // the screen is off and no timers are running — only the GPS service is.
    if (dtSec != null && dtSec > 0 && dtSec <= 15 && (mph ?? speedRef.current) >= MOVING_MPH) {
      movingMs.current += dtSec * 1000
    }
    lastFix.current = p
    setPoints((ps) => [...ps, p])

    // Elevation. Preferred source: the barometer (via the native plugin) —
    // pressure resolves ~0.3 m where GPS altitude wobbles ±10 m, so the
    // hysteresis gate can drop from 3 m to 1 m and catch bridge-sized
    // climbs. A slow-tracked offset pins the baro curve to the GPS altitude
    // scale (and absorbs weather drift). GPS-only path stays as fallback.
    const baroFresh = baroAlt.current != null && Date.now() - baroAt.current < 20000
    if (baroFresh) {
      if (altitude != null) {
        const target = altitude - baroAlt.current
        baroOffset.current = baroOffset.current == null ? target : baroOffset.current * 0.98 + target * 0.02
      }
      const a0 = baroAlt.current + (baroOffset.current ?? 0)
      altSmooth.current = altSmooth.current == null ? a0 : altSmooth.current * 0.5 + a0 * 0.5
      const a = altSmooth.current
      if (altBase.current == null || a < altBase.current) altBase.current = a
      else if (a - altBase.current >= 1) {
        setElevation((e) => e + (a - altBase.current) * 3.28084)
        altBase.current = a
      }
    } else if (altitude != null) {
      // No barometer: smooth the noisy GPS altitude and only bank climbs
      // clearing a 3 m gate — otherwise ±10 m jitter becomes fake mountains.
      altSmooth.current = altSmooth.current == null ? altitude : altSmooth.current * 0.7 + altitude * 0.3
      const a = altSmooth.current
      if (altBase.current == null || a < altBase.current) altBase.current = a
      else if (a - altBase.current >= 3) {
        setElevation((e) => e + (a - altBase.current) * 3.28084)
        altBase.current = a
      }
    }
  }, [])

  // ---- accelerometer: surface roughness --------------------------------------
  function startMotion() {
    const handler = (e) => {
      if (statusRef.current !== 'running') return
      let mag = null
      const a = e.acceleration
      if (a && a.x != null) mag = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)
      else {
        const g = e.accelerationIncludingGravity
        if (g && g.x != null) mag = Math.abs(Math.sqrt(g.x ** 2 + g.y ** 2 + g.z ** 2) - 9.81)
      }
      if (mag == null) return
      motionSeen.current = true
      motionBuf.current.push(mag)
      if (motionBuf.current.length > 240) motionBuf.current.shift()
    }
    window.addEventListener('devicemotion', handler)
    motionHandler.current = handler
  }

  async function requestMotion() {
    // In the APK, sample natively — devicemotion dies when the screen sleeps.
    if (Roughness) {
      try {
        const info = await Roughness.start()
        motionSeen.current = true
        dlog('motion:native-started', info, { critical: true })
        return
      } catch (e) {
        dlog('motion:native-failed', String(e?.message ?? e).slice(0, 200), { critical: true })
        /* no accelerometer — fall through to the web path */
      }
    }
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission()
        if (res !== 'granted') { dlog('motion:web-denied', null, { critical: true }); return }
      }
      startMotion()
      dlog('motion:web-started', null, { critical: true })
    } catch { /* no accelerometer access */ }
  }

  // ---- wake lock (browser only — the APK's foreground service replaces it) ---
  async function acquireWakeLock() {
    if (isNativeApp) return
    try { wakeLock.current = await navigator.wakeLock?.request('screen') } catch { /* unsupported */ }
  }
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && statusRef.current === 'running') acquireWakeLock()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // ---- demo simulator ----------------------------------------------------------
  useEffect(() => {
    if (status !== 'running' || mode !== 'demo') return
    const i = setInterval(() => {
      const s = demoRef.current
      s.t += 1
      const base = type.id === 'speed' ? 15 : type.id === 'recovery' ? 8 : 11
      const stopped = s.t % 50 < 6
      const mph = stopped ? 0 : Math.max(0, base + Math.sin(s.t / 9) * 2.6 + (Math.random() - 0.5) * 1.4)
      setSpeed(mph)
      speedRef.current = mph
      setTopSpeed((v) => Math.max(v, mph))
      setMeters((m) => m + (mph * 1609.344) / 3600)
      if (mph >= MOVING_MPH) movingMs.current += 1000
      setElevation((e) => e + (stopped ? 0 : Math.max(0, Math.sin(s.t / 14) * 0.9)))
      const bpm = Math.round(132 + Math.sin(s.t / 11) * 12 + (Math.random() - 0.5) * 5)
      hrSamples.current.push(bpm)
      setHr(bpm)
      const rough = s.t % 34 < 12
      roughRms.current = +(rough ? 7.5 + Math.random() * 2 : 2.5 + Math.random() * 1.5).toFixed(2)
      setSurface(mph >= MOVING_MPH ? (roughRms.current >= ROUGH_RMS ? 'rough' : 'smooth') : null)
      s.heading = (s.heading ?? 0) + Math.sin(s.t / 15) * 0.07 + (Math.random() - 0.5) * 0.03
      const stepM = (mph * 1609.344) / 3600
      s.lat = (s.lat ?? 39.7392) + (stepM * Math.cos(s.heading)) / 111320
      s.lon = (s.lon ?? -104.9903) + (stepM * Math.sin(s.heading)) / (111320 * Math.cos((s.lat * Math.PI) / 180))
      setPoints((ps) => [...ps, { lat: s.lat, lon: s.lon, t: Date.now(), r: roughRms.current }])
    }, 1000)
    return () => clearInterval(i)
  }, [status, mode, type.id])

  async function startGps() {
    dlog('session:start', { type: typeId, mode: 'gps' }, { critical: true })
    try {
      watcher.current = await startLocationWatch(handlePosition, (err) => {
        dlog('gps:error', String(err?.message ?? err).slice(0, 200), { critical: true })
        setGpsError(err?.message || 'Location unavailable — switch to demo mode to keep tracking time.')
      })
    } catch (e) {
      dlog('gps:start-failed', String(e?.message ?? e).slice(0, 200), { critical: true })
      setGpsError(e.message)
      return startDemo()
    }
    requestMotion()     // must happen inside this tap (iOS)
    acquireWakeLock()
    startedAt.current = new Date().toISOString()
    startTs.current = Date.now()
    setMode('gps')
    setStatus('running')
  }

  function startDemo() {
    dlog('session:start', { type: typeId, mode: 'demo' }, { critical: true })
    acquireWakeLock()
    startedAt.current = new Date().toISOString()
    startTs.current = Date.now()
    setMode('demo')
    setStatus('running')
  }

  function stopWatch() {
    watcher.current?.stop()
    watcher.current = null
  }
  function releaseWakeLock() {
    wakeLock.current?.release?.().catch(() => {})
    wakeLock.current = null
  }
  useEffect(() => () => {
    // Leaving the live screen mid-session (back button, navigation) kills
    // tracking — if the log ends here, it was a navigation, not a crash.
    if (statusRef.current === 'running' || statusRef.current === 'paused') {
      dlog('session:unmounted-while-tracking', { status: statusRef.current }, { critical: true })
    }
    stopWatch()
    releaseWakeLock()
    Roughness?.stop().catch(() => {})
    if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current)
  }, [])

  function pause() {
    dlog('ui:pause', null, { critical: true })
    pauseStart.current = Date.now()
    setStatus('paused')
    setSpeed(0)
    speedRef.current = 0
    setSurface(null)
  }
  function resume() {
    dlog('ui:resume', null, { critical: true })
    if (pauseStart.current != null) {
      pausedMs.current += Date.now() - pauseStart.current
      pauseStart.current = null
    }
    lastFix.current = null // don't count the paused gap as one giant GPS segment
    Roughness?.read().catch(() => {}) // discard vibration accumulated while paused
    setStatus('running')
    acquireWakeLock()
  }
  function finish() {
    dlog('ui:finish', { points: points.length, miles: +miles.toFixed(2) }, { critical: true })
    doneAt.current = pauseStart.current ?? Date.now()
    stopWatch()
    releaseWakeLock()
    Roughness?.stop().catch(() => {})
    setStatus('done')
    setSpeed(0)
    setSaveOpen(true)
  }
  function lap() {
    dlog('ui:lap', null, { critical: true })
    setLaps((l) => [...l, { n: l.length + 1, atSec: elapsedSec(), miles: +miles.toFixed(2), avg: +avgSpeed.toFixed(1) }])
  }

  function save() {
    const hrs = hrSamples.current
    const rs = cleanRoughness(points).filter((v) => v != null)
    const roughPct = rs.length >= 5 ? Math.round((rs.filter((v) => v >= ROUGH_RMS).length / rs.length) * 100) : null
    const coveragePct = points.length ? Math.round((rs.length / points.length) * 100) : 0
    const finalElapsed = elapsedSec()
    // Roughness percentiles ride on the finish marker so a single log line
    // carries the calibration essentials even when the per-fix entries are
    // lost to ring-buffer wraparound or a truncated share.
    const sortedRs = [...rs].sort((a, b) => a - b)
    const q = (f) => (sortedRs.length ? +sortedRs[Math.round(f * (sortedRs.length - 1))].toFixed(2) : undefined)
    dlog('session:finish', {
      miles: +miles.toFixed(2), durationSec: finalElapsed, points: points.length, coveragePct,
      rMed: q(0.5), rP90: q(0.9), rMax: q(1),
    }, { critical: true })
    // Which trail was this? Preset from "Skate this trail", else match the
    // route against saved trails — and let the trail name the session when
    // the user didn't.
    let trailId = presetTrailId || undefined
    let autoName = null
    if (!trailId && mode === 'gps') {
      const matched = matchRouteToTrails(points, data.trails)
      if (matched) { trailId = matched.id; autoName = matched.name }
    }
    const id = data.addWorkout({
      date: todayISO(),
      kind: 'skate',
      typeId,
      trailId,
      name: name || autoName || type.name,
      minutes: Math.max(1, Math.round(finalElapsed / 60)),
      durationSec: finalElapsed,
      movingSec,
      stoppedSec: Math.max(0, finalElapsed - movingSec),
      startedAt: startedAt.current,
      miles: +miles.toFixed(2),
      avgSpeed: +avgSpeed.toFixed(1),
      topSpeed: +topSpeed.toFixed(1),
      elevation: Math.round(elevation),
      avgHr: hrs.length ? Math.round(hrs.reduce((a, v) => a + v, 0) / hrs.length) : undefined,
      terrain: roughPct != null ? { roughPct, smoothPct: 100 - roughPct, coveragePct } : undefined,
      calories,
      laps,
      route: points.map((p) => ({ lat: p.lat, lon: p.lon, t: p.t, ...(p.r != null ? { r: p.r } : {}) })),
      source: mode,
    })
    nav(`/session/${id}`)
  }

  if (!data) return null

  if (status === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center pt-[calc(1.5rem+var(--sat))]">
        <div className="mb-3 text-volt-400"><Icon name={type.icon} size={52} /></div>
        <h1 className="font-display text-3xl font-bold text-white">{type.name}</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">{type.blurb}</p>

        <div className="mt-8 w-full max-w-sm space-y-3">
          <button onClick={startGps} className="btn-primary w-full !py-4 text-base">
            <Icon name="my_location" size={18} /> Start with GPS
          </button>
          <button onClick={startDemo} className="btn-ghost w-full !py-3">
            <Icon name="play_arrow" size={18} /> Demo mode (simulated)
          </button>
          <p className="text-xs text-slate-500 pt-1">
            {isNativeApp
              ? 'Tracking runs as a foreground service — it keeps recording with the screen off. Allow location and notification access when asked.'
              : 'GPS needs location permission and works best outdoors. Allowing motion access too lets Skate read pavement vibration and map rough vs smooth stretches.'}
          </p>
          <Link to="/skate" className="block text-xs text-slate-500 hover:text-slate-300 pt-2"><Icon name="arrow_back" size={12} /> Pick a different discipline</Link>
        </div>
      </div>
    )
  }

  const acquiring = mode === 'gps' && points.length === 0 && !gpsError

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 max-w-2xl mx-auto pt-[calc(1rem+var(--sat))]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status === 'running' ? 'bg-volt-500 live-dot' : 'bg-slate-600'}`} />
          <span className="text-sm font-semibold text-slate-300">
            <Icon name={type.icon} size={16} className="mr-1" />{type.name}{status === 'paused' && ' · Paused'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {surface && (
            <span className={`chip ${surface === 'rough' ? 'bg-ember-500/15 text-ember-400' : 'bg-volt-500/15 text-volt-400'}`}>
              {surface === 'rough' ? 'Rough' : 'Smooth'}
            </span>
          )}
          <span className={`chip ${mode === 'gps' ? 'bg-surge-500/15 text-surge-400' : 'bg-ember-500/15 text-ember-400'}`}>
            {mode === 'gps' ? 'GPS' : 'DEMO'}
          </span>
        </div>
      </div>

      {gpsError && (
        <div className="mt-3 rounded-xl border border-ember-500/25 bg-ember-500/10 px-3 py-2 text-xs text-ember-400">
          {gpsError}
          <button onClick={startDemo} className="underline ml-1 font-semibold">Use demo mode</button>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center py-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Speed</div>
          <div className={`${BIG} text-[5.5rem] sm:text-[7rem] text-volt-400`}>{speed.toFixed(1)}</div>
          <div className="text-sm text-slate-500 -mt-1">
            {acquiring ? 'mph · acquiring GPS signal…' : 'mph'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <Metric label="Distance" value={miles.toFixed(2)} unit="mi" />
          <Metric label="Moving Time" value={fmtDuration(movingSec)} unit={stoppedSec > 0 ? `${fmtDuration(stoppedSec)} stopped` : 'no stops yet'} />
          <Metric label="Avg Speed" value={avgSpeed.toFixed(1)} unit="mph moving" />
          <Metric label="Calories" value={calories.toLocaleString()} unit="cal" accent="text-ember-400" />
          <Metric label="Elevation Gain" value={Math.round(elevation)} unit="ft" />
          {hr != null
            ? <Metric label="Heart Rate" value={hr} unit="bpm" accent="text-surge-400" />
            : <Metric label="Elapsed" value={fmtDuration(elapsed)} unit="total" />}
        </div>

        {laps.length > 0 && (
          <div className="mt-4 card-tight max-h-28 overflow-y-auto">
            {laps.slice().reverse().map((l) => (
              <div key={l.n} className="flex justify-between text-xs py-1 tabular-nums">
                <span className="text-slate-400">Lap {l.n}</span>
                <span className="text-slate-300">{fmtDuration(l.atSec)} · {l.miles} mi · {l.avg} mph</span>
              </div>
            ))}
          </div>
        )}

        {points.length > 3 && (
          <div className="mt-4">
            <RouteMap points={points} height={130} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 pb-[var(--sab)]">
        {status === 'running' ? (
          <button onClick={pause} className="btn-ghost !py-4"><Icon name="pause" size={18} /> Pause</button>
        ) : (
          <button onClick={resume} className="btn-primary !py-4"><Icon name="play_arrow" size={18} /> Resume</button>
        )}
        <button onClick={lap} className="btn-ghost !py-4"><Icon name="sports_score" size={18} /> Lap</button>
        <button onClick={finish} className="btn-danger !py-4"><Icon name="stop" size={18} /> Finish</button>
      </div>
      {mode === 'gps' && status === 'running' && (
        <p className="text-center text-[11px] text-slate-500 mt-2 pb-1">
          {isNativeApp
            ? 'Recording continues with the screen off — look for the notification.'
            : 'Keep the screen on — browsers pause GPS when the phone locks.'}
        </p>
      )}

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title={<>Nice work <Icon name="roller_skating" size={20} className="text-volt-400" /></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <Summary label="Distance" value={`${miles.toFixed(2)} mi`} />
            <Summary label="Moving / Total" value={`${fmtDuration(movingSec)} / ${fmtDuration(elapsed)}`} />
            <Summary label="Avg Speed" value={`${avgSpeed.toFixed(1)} mph`} />
            <Summary label="Calories" value={`${calories}`} />
            <Summary label="Top Speed" value={`${topSpeed.toFixed(1)} mph`} />
            <Summary label="Elevation" value={`${Math.round(elevation)} ft`} />
          </div>
          <Highlights miles={miles} avgSpeed={avgSpeed} topSpeed={topSpeed} minutes={elapsed / 60} calories={calories} />
          <div>
            <label className="label">Name this session</label>
            <input className="input" placeholder={type.name} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button onClick={save} className="btn-primary w-full">Save skate</button>
          <button onClick={() => nav('/')} className="btn-ghost w-full">Discard</button>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ label, value, unit, accent = 'text-white' }) {
  return (
    <div className="card text-center py-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`font-display text-3xl font-bold tabular-nums mt-1 ${accent}`}>{value}</div>
      {unit && <div className="text-[11px] text-slate-500">{unit}</div>}
    </div>
  )
}

function Summary({ label, value }) {
  return (
    <div className="card-tight">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-display font-bold text-white tabular-nums">{value}</div>
    </div>
  )
}

function Highlights({ miles, avgSpeed, topSpeed, minutes, calories }) {
  const data = useData()
  const prs = data?.d?.prs
  if (!prs) return null
  const hits = []
  if (miles > prs.longestDistance) hits.push({ icon: 'military_tech', text: 'Longest Distance — new PR' })
  if (avgSpeed > prs.fastestAvg) hits.push({ icon: 'bolt', text: 'Fastest Avg Speed — new PR' })
  if (topSpeed > prs.fastestTop) hits.push({ icon: 'rocket_launch', text: 'Fastest Top Speed — new PR' })
  if (minutes > prs.longestWorkout) hits.push({ icon: 'timer', text: 'Longest Continuous Skate — new PR' })
  if (calories > prs.mostCalories) hits.push({ icon: 'local_fire_department', text: 'Most Calories Burned — new PR' })
  if (!hits.length) {
    return (
      <div className="card-tight text-sm text-slate-400">
        No records broken — but you got outside and moved. That's the point.
      </div>
    )
  }
  return (
    <div className="card-tight border border-volt-500/30 bg-volt-500/5 space-y-1">
      <div className="font-display font-bold text-volt-400 text-sm">Post-skate highlights</div>
      {hits.map((h) => (
        <div key={h.text} className="text-sm text-slate-200">
          <Icon name={h.icon} size={15} className="mr-1.5 text-volt-400" />{h.text}
        </div>
      ))}
    </div>
  )
}
