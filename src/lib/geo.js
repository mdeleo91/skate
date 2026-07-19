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
export async function getCurrentPosition(opts = {}) {
  try {
    return await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, ...opts })
  } catch (e) {
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
