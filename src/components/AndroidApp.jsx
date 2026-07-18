import { useState } from 'react'
import { Card, SectionTitle } from './ui'
import Icon from './icons'
import { isNativeApp } from '../lib/geo'
import { BUILD_ID, APK_URL, fetchLatestAndroidBuild, openDownload } from '../lib/appUpdate'

// One card, two jobs:
//  - In a browser: "get the Android app" with a direct APK download.
//  - Inside the APK: show the installed build and check for/download updates.
//    Opening the new APK installs over the old one — data is kept.
export default function AndroidApp() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  if (isNativeApp) return <UpdateCard />
  if (isIOS) return null // an APK is no use on an iPhone
  return <InstallCard />
}

function InstallCard() {
  return (
    <Card>
      <SectionTitle><Icon name="android" size={15} className="mr-1.5 text-volt-400" />SkateFit for Android</SectionTitle>
      <p className="text-sm text-slate-400 leading-relaxed">
        The Android app tracks skates with the <span className="text-slate-200">screen off</span> —
        GPS runs as a background service, so you can lock the phone and pocket it. The browser
        version pauses when the phone sleeps.
      </p>
      <a href={APK_URL} className="btn-primary w-full mt-3.5">
        <Icon name="download" size={17} /> Download the Android app
      </a>
      <CopyLinkButton />
      <p className="text-xs text-slate-500 mt-3">
        If the download sticks at "Downloading…", that's the popup browser failing to save files —
        copy the link above and paste it into the Chrome app itself.
      </p>
      <ol className="text-xs text-slate-500 mt-3 space-y-1 list-decimal list-inside leading-relaxed">
        <li>When the download finishes, close the download sheet — it won't advance on its own.</li>
        <li>Tap the <span className="text-slate-300">skate.apk</span> notification, or find it in the <span className="text-slate-300">Files</span> app under Downloads.</li>
        <li>Allow installs from your browser when Android asks, then tap <span className="text-slate-300">Install</span>.</li>
        <li>If Play Protect warns (normal outside the Play Store): More details → Install anyway.</li>
      </ol>
    </Card>
  )
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn-ghost w-full mt-2 !py-1.5 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(APK_URL)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch { /* clipboard unavailable */ }
      }}
    >
      {copied ? 'Copied — paste it into Chrome' : 'Copy download link'}
    </button>
  )
}

function UpdateCard() {
  const [state, setState] = useState({ status: 'idle' }) // idle | checking | current | available | unknown | error

  async function check() {
    setState({ status: 'checking' })
    try {
      const latest = await fetchLatestAndroidBuild()
      if (!latest.sha || BUILD_ID === 'dev') setState({ status: 'unknown', latest })
      else if (latest.sha === BUILD_ID) setState({ status: 'current', latest })
      else setState({ status: 'available', latest })
    } catch {
      setState({ status: 'error' })
    }
  }

  const latestDate = state.latest?.publishedAt
    ? new Date(state.latest.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <Card>
      <SectionTitle action={<span className="text-xs text-slate-500 tabular-nums">build {BUILD_ID}</span>}>
        <Icon name="android" size={15} className="mr-1.5 text-volt-400" />App Updates
      </SectionTitle>

      {state.status === 'idle' && (
        <>
          <p className="text-sm text-slate-400 mb-3">
            New features ship often. Updating installs over this version — all your data stays.
          </p>
          <button onClick={check} className="btn-ghost w-full">Check for updates</button>
        </>
      )}
      {state.status === 'checking' && <div className="text-sm text-slate-400 py-2">Checking the latest build…</div>}
      {state.status === 'current' && (
        <>
          <p className="text-sm text-volt-400 mb-3">
            <Icon name="check_circle" size={15} className="mr-1" />You're on the latest build{latestDate ? ` (${latestDate})` : ''}.
          </p>
          <button onClick={check} className="btn-ghost w-full !py-1.5 text-xs">Check again</button>
        </>
      )}
      {(state.status === 'available' || state.status === 'unknown') && (
        <>
          <p className="text-sm text-slate-400 mb-3">
            {state.status === 'available'
              ? <>Update available — build <span className="text-slate-200 tabular-nums">{state.latest.sha}</span>{latestDate ? `, published ${latestDate}` : ''}.</>
              : 'Couldn’t compare versions — you can grab the latest build anyway.'}
            {' '}Open the downloaded file and Android installs it over this one; your data stays.
          </p>
          <button onClick={() => openDownload(state.latest?.url || APK_URL)} className="btn-primary w-full">
            <Icon name="download" size={17} /> Download update
          </button>
          <p className="text-xs text-slate-500 mt-2">
            The download opens in your browser — when it finishes, tap the skate.apk notification
            and choose Install.
          </p>
        </>
      )}
      {state.status === 'error' && (
        <>
          <p className="text-sm text-ember-400 mb-3">Couldn't reach GitHub — check your connection.</p>
          <button onClick={check} className="btn-ghost w-full">Try again</button>
        </>
      )}
    </Card>
  )
}
