// Android app install / update plumbing.
//
// Every push to main builds an APK in GitHub Actions and republishes it to the
// rolling 'android' release. The web bundle carries the commit it was built
// from (__BUILD_ID__, injected by Vite), and the release notes carry the
// commit the newest APK was built from — comparing the two answers
// "is there an update?".
export const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'
export const APK_URL = 'https://github.com/mdeleo91/skate/releases/download/android/skate.apk'

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
