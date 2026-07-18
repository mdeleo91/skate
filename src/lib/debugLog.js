// Crash-surviving diagnostic log. A ring buffer of timestamped events kept in
// localStorage so it survives app kills, crashes and restarts — the point is
// to answer "why did the tracker stop?" after the fact. Writes are batched
// (4 s) because fix events arrive twice a second; critical events (lifecycle,
// errors) flush immediately so the last entries survive a hard kill.
const KEY = 'skate.debuglog.v1'
const MAX = 6000 // ~a few long skates of per-fix entries

let buf = null
let dirty = false
let flushTimer = null

function load() {
  if (buf) return buf
  try { buf = JSON.parse(localStorage.getItem(KEY)) || [] } catch { buf = [] }
  return buf
}

export function flushLog() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  if (!dirty) return
  try {
    localStorage.setItem(KEY, JSON.stringify(load()))
    dirty = false
  } catch {
    // Storage full — drop the older half and try once more.
    const b = load()
    b.splice(0, Math.floor(b.length / 2))
    try { localStorage.setItem(KEY, JSON.stringify(b)); dirty = false } catch { /* give up */ }
  }
}

export function dlog(event, data, { critical = false } = {}) {
  const b = load()
  b.push({ t: new Date().toISOString(), e: event, ...(data != null ? { d: data } : {}) })
  if (b.length > MAX) b.splice(0, b.length - MAX)
  dirty = true
  if (critical) flushLog()
  else if (!flushTimer) flushTimer = setTimeout(flushLog, 4000)
}

export function logEntryCount() {
  return load().length
}

export function exportLogText() {
  flushLog()
  return load().map((e) => JSON.stringify(e)).join('\n')
}

export function clearLog() {
  buf = []
  dirty = false
  try { localStorage.removeItem(KEY) } catch { /* fine */ }
}

const SESSION_END = new Set(['session:finish', 'ui:finish'])

// Called once at boot. Registers global error hooks and, crucially, checks
// whether the previous run died mid-session: a session:start with no finish
// before this app:start means the app was killed or crashed while tracking.
export function installDebugLog({ build, native }) {
  const b = load()
  let lastStart = -1
  let lastEnd = -1
  b.forEach((entry, i) => {
    if (entry.e === 'session:start') lastStart = i
    if (SESSION_END.has(entry.e)) lastEnd = i
  })
  if (lastStart > lastEnd) {
    const last = b[b.length - 1]
    dlog('session:unclean-shutdown', { lastEvent: last?.e, lastAt: last?.t }, { critical: true })
  }
  dlog('app:start', { build, native, ua: navigator.userAgent.slice(0, 120) }, { critical: true })

  window.addEventListener('error', (e) =>
    dlog('js:error', { msg: String(e.message).slice(0, 300), src: `${e.filename?.split('/').pop()}:${e.lineno}` }, { critical: true }))
  window.addEventListener('unhandledrejection', (e) =>
    dlog('js:rejection', { msg: String(e.reason?.message ?? e.reason).slice(0, 300) }, { critical: true }))
  // Screen off / app backgrounded / restored — the timeline around a death.
  document.addEventListener('visibilitychange', () =>
    dlog('app:visibility', document.visibilityState, { critical: true }))
  window.addEventListener('pagehide', () => dlog('app:pagehide', null, { critical: true }))
}
