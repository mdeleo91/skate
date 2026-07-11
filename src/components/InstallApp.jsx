import { useEffect, useState } from 'react'
import { Card, SectionTitle } from './ui'

// Chrome/Edge/Android fire `beforeinstallprompt` and let us trigger the native
// install sheet. iOS Safari does not — it only supports Share → Add to Home Screen,
// so for iOS we show instructions instead of a button that could never work.
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
    setInstalled(standalone)

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return { canInstall: !!deferred, promptInstall, installed, isIOS }
}

export default function InstallApp() {
  const { canInstall, promptInstall, installed, isIOS } = useInstallPrompt()

  if (installed) {
    return (
      <Card className="border-volt-500/30 bg-volt-500/[0.04]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <div className="font-display font-bold text-white">Installed</div>
            <div className="text-xs text-slate-400 mt-0.5">
              You're running Skate as an app. GPS, full screen, home-screen icon — the works.
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <SectionTitle>📱 Install Skate on your phone</SectionTitle>
      <p className="text-sm text-slate-400 leading-relaxed">
        Skate runs as a real app on your home screen — full screen, no browser chrome, with GPS for
        live skate tracking. Nothing to download from an app store.
      </p>

      {canInstall && (
        <button onClick={promptInstall} className="btn-primary w-full mt-3.5">
          Install app
        </button>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="card-tight">
          <div className="font-semibold text-slate-100 text-sm mb-1.5"> iPhone / iPad</div>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Open this page in <span className="text-slate-200">Safari</span></li>
            <li>Tap the <span className="text-slate-200">Share</span> button (square with an arrow)</li>
            <li>Scroll down and tap <span className="text-slate-200">Add to Home Screen</span></li>
            <li>Tap <span className="text-slate-200">Add</span> — Skate appears on your home screen</li>
          </ol>
        </div>
        <div className="card-tight">
          <div className="font-semibold text-slate-100 text-sm mb-1.5">🤖 Android</div>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Open this page in <span className="text-slate-200">Chrome</span></li>
            <li>Tap <span className="text-slate-200">Install app</span> above, or the ⋮ menu</li>
            <li>Choose <span className="text-slate-200">Install app</span> / Add to Home screen</li>
            <li>Confirm — Skate installs like any other app</li>
          </ol>
        </div>
      </div>

      {isIOS && (
        <p className="text-xs text-slate-500 mt-3">
          iOS has no install button — Apple only allows Add to Home Screen from the Safari Share menu.
          Chrome on iPhone can't do it; use Safari.
        </p>
      )}
      <p className="text-xs text-slate-500 mt-3">
        When you first start a live skate, allow location access — that's what powers speed, distance
        and route tracking.
      </p>
    </Card>
  )
}
