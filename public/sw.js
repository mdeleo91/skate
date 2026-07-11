/* Skate service worker.
 *
 * Goals, in order:
 *   1. Make the app installable (a fetch handler is required for the install criteria).
 *   2. Cache the app shell so it opens instantly and survives a dead signal mid-trail.
 *   3. Never, ever get in the way of authentication or live data.
 *
 * The rules below are deliberately conservative: anything cross-origin (Supabase auth,
 * open-meteo weather) goes straight to the network and is never cached or replayed.
 */

const VERSION = 'skate-v2'
const SHELL_CACHE = `${VERSION}-shell`
const ASSET_CACHE = `${VERSION}-assets`

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// Let the page tell a waiting worker to take over immediately after a deploy.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only ever touch our own GET traffic. Supabase auth (POST/GET to *.supabase.co)
  // and the weather API are cross-origin and must always hit the network live —
  // a stale cached session or a cached token response would be a genuine bug.
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Never cache the Supabase auth callback / password-recovery landing.
  if (url.searchParams.has('code') || url.searchParams.has('access_token')) return

  // Navigations: network first (so a fresh deploy is picked up), falling back to the
  // cached shell when offline. The SPA's client-side router takes it from there, so
  // deep links like /stats still work offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || caches.match('/'))
        )
    )
    return
  }

  // Hashed build assets, icons, fonts: cache-first, then revalidate in the background.
  // Vite fingerprints these filenames, so a cached hit is always the right content.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone()
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
