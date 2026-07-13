// Android app install / update plumbing.
//
// Every push to main builds an APK in GitHub Actions and republishes it to the
// rolling 'android' release. The web bundle carries the commit it was built
// from (__BUILD_ID__, injected by Vite), and the release notes carry the
// commit the newest APK was built from — comparing the two answers
// "is there an update?".
import { Capacitor, registerPlugin } from '@capacitor/core'

export const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'
export const APK_URL = 'https://github.com/mdeleo91/skate/releases/download/android/skate.apk'

// Open a download link where it can actually download. Inside the APK the
// WebView can't save files, so hand the URL to the system browser (Chrome),
// whose download manager then offers the install.
export async function openDownload(url) {
  if (Capacitor.isNativePlatform()) {
    try {
      const AppLauncher = registerPlugin('AppLauncher')
      await AppLauncher.openUrl({ url })
      return
    } catch { /* fall through to a plain open */ }
  }
  window.open(url, '_blank', 'noopener')
}

const RELEASE_API = 'https://api.github.com/repos/mdeleo91/skate/releases/tags/android'

export async function fetchLatestAndroidBuild() {
  const res = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error('Could not reach GitHub to check the latest build.')
  const release = await res.json()
  const sha = /built from ([0-9a-f]{7,40})/i.exec(release.body || '')?.[1]?.slice(0, 7) ?? null
  return {
    sha,
    publishedAt: release.published_at,
    url: release.assets?.find((a) => a.name.endsWith('.apk'))?.browser_download_url || APK_URL,
  }
}
