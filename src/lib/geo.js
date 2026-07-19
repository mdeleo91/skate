import { Capacitor, registerPlugin } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

// True when running inside the Android/iOS app shell rather than a browser.
export const isNativeApp = Capacitor.isNativePlatform()

// Native accelerometer sampler (RoughnessPlugin.java). Unlike the web
// devicemotion event, it keeps measuring pavement vibration with the screen
// off — start() when a GPS session begins, read() once per fix, stop() at the
// end. Null in the browser, where LiveSkate falls back to devicemotion.
export const Roughness = isNativeApp ? registerPlugin('Roughness') : null

// One-shot position for weather / trail search. The WebView's built-in
// navigator.geolocation is unreliable inside the APK even with location
// permission granted; the official Geolocation plugin goes through Play
// Services natively (and wraps navigator.geolocation on the web).
// Coordinates → "St. Petersburg, FL" so the app can show which city its
// weather and trail lookups are actually using. Free, keyless, client-side.
export async function reverseCity(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    )
    if (!res.ok) return null
    const j = await res.json()
    const city = j.city || j.locality
    const state = (j.principalSubdivisionCode || '').split('-')[1]
    return city ? (state ? `${city}, ${state}` : city) : null
  } catch {
    return null
  }
}

// Remember the last position we ever saw (from any source) so indoor
// lookups degrade to "where you were recently" instead of a Denver default.
const LAST_POS_KEY = 'skate.lastPos'
export function rememberPosition(lat, lon) {
  try { localStorage.setItem(LAST_POS_KEY, JSON.stringify({ lat, lon, at: Date.now() })) } catch { /* full */ }
}
function lastKnownPosition(maxAgeMs = 24 * 3600 * 1000) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_POS_KEY))
    if (saved && Date.now() - saved.at < maxAgeMs) {
      return { coords: { latitude: saved.lat, longitude: saved.lon }, stale: true }
    }
  } catch { /* corrupt */ }
  return null
}

export async function getCurrentPosition(opts = {}) {
  try {
    // maximumAge: a cached ~10-minute-old position is perfect for weather and
    // trail search, and returns instantly indoors where a fresh fix times out.
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000, ...opts,
    })
    rememberPosition(pos.coords.latitude, pos.coords.longitude)
    return pos
  } catch (e) {
    const fallback = lastKnownPosition()
    if (fallback) return fallback
    const msg = String(e?.message ?? e)
    if (/denied|permission/i.test(msg)) {
      throw new Error('Location permission is needed — allow it in Settings and try again.')
    }
    throw new Error(msg || 'Location unavailable')
  }
}

// One watcher API for both worlds.
//
// Native (APK): @capacitor-community/background-geolocation runs an Android
// foreground service — the persistent notification — so fixes keep flowing
// with the screen off or the app in the background.
//
// Browser: plain navigator.geolocation, which only runs while the page is
// visible; the wake lock in LiveSkate keeps the screen (and therefore GPS) on.
//
// Both paths call onFix with the browser Position shape.
export async function startLocationWatch(onFix, onError) {
  // Every skate keeps the last-known position fresh for weather/trail lookups.
  let lastRemembered = 0
  const onFixRaw = onFix
  onFix = (pos) => {
    const now = Date.now()
    if (now - lastRemembered > 60000) {
      lastRemembered = now
      rememberPosition(pos.coords.latitude, pos.coords.longitude)
    }
    onFixRaw(pos)
  }
  if (isNativeApp) {
    const BackgroundGeolocation = registerPlugin('BackgroundGeolocation')
    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: 'SkateFit session in progress',
        backgroundMessage: 'Distance and route are still being recorded.',
        requestPermissions: true,
        stale: false,
        distanceFilter: 2, // meters between fixes; keeps the trace dense enough for splits
      },
      (location, error) => {
        if (error) {
          if (error.code === 'NOT_AUTHORIZED') {
            onError(new Error('Location permission is required — enable it in Settings and restart the session.'))
          } else {
            onError(error)
          }
          return
        }
        if (!location) return
        onFix({
          coords: {
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude,
            speed: location.speed,
            accuracy: location.accuracy,
          },
          timestamp: location.time ?? Date.now(),
        })
      }
    )
    return { stop: () => BackgroundGeolocation.removeWatcher({ id }).catch(() => {}) }
  }

  if (!navigator.geolocation) throw new Error('This browser has no Geolocation API.')
  const id = navigator.geolocation.watchPosition(onFix, onError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 12000,
  })
  return { stop: () => navigator.geolocation.clearWatch(id) }
}
