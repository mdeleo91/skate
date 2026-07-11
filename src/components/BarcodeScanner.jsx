import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from './ui'
import Icon from './icons'
import { lookupBarcode } from '../lib/foodSearch'

// Live barcode scanner backed by Open Food Facts.
// Decoding strategy: the native BarcodeDetector API where the browser has it
// (Chrome, Android — the PWA target), otherwise ZXing is lazy-loaded as a
// fallback (iOS Safari has no BarcodeDetector). No camera at all? Type the
// digits under the viewfinder — same lookup.
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

export default function BarcodeScanner({ open, onClose, onFound }) {
  if (!open) return null
  return <Scanner onClose={onClose} onFound={onFound} />
}

function Scanner({ onClose, onFound }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const pollRef = useRef(null)
  const stopZxingRef = useRef(null)
  const busyRef = useRef(false)
  const lastRef = useRef({ code: null, at: 0 })
  const [phase, setPhase] = useState('starting') // starting | scanning | nocamera
  const [lookup, setLookup] = useState(null)     // { code, status: 'loading' | 'missing' | 'error' }
  const [manual, setManual] = useState('')

  const handleCode = useCallback(async (code) => {
    const now = Date.now()
    // A live camera re-reads the same label many times a second — throttle it.
    if (busyRef.current || (lastRef.current.code === code && now - lastRef.current.at < 5000)) return
    busyRef.current = true
    lastRef.current = { code, at: now }
    setLookup({ code, status: 'loading' })
    try {
      const food = await lookupBarcode(code)
      if (food) { onFound(food); return } // parent closes the scanner
      setLookup({ code, status: 'missing' })
    } catch {
      setLookup({ code, status: 'error' })
    } finally {
      busyRef.current = false
    }
  }, [onFound])

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return setPhase('nocamera')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        if (cancelled) return
        setPhase('scanning')

        // BarcodeDetector can be present but support zero formats (desktop
        // Chrome on some platforms) — probe before trusting it.
        let native = false
        if ('BarcodeDetector' in window) {
          try {
            const supported = await window.BarcodeDetector.getSupportedFormats()
            native = FORMATS.some((f) => supported.includes(f))
          } catch { native = false }
        }

        if (native) {
          let detector
          try { detector = new window.BarcodeDetector({ formats: FORMATS }) }
          catch { detector = new window.BarcodeDetector() }
          pollRef.current = setInterval(async () => {
            try {
              const codes = await detector.detect(video)
              if (codes.length) handleCode(codes[0].rawValue)
            } catch { /* frame not ready yet */ }
          }, 350)
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          const reader = new BrowserMultiFormatReader()
          const controls = await reader.decodeFromStream(stream, video, (result) => {
            if (result) handleCode(result.getText())
          })
          if (cancelled) controls.stop()
          else stopZxingRef.current = () => controls.stop()
        }
      } catch {
        if (!cancelled) setPhase('nocamera')
      }
    }
    start()

    return () => {
      cancelled = true
      clearInterval(pollRef.current)
      stopZxingRef.current?.()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [handleCode])

  const manualValid = /^\d{6,14}$/.test(manual.trim())

  return (
    <Modal open onClose={onClose} title={<><Icon name="barcode_scanner" size={19} className="mr-1.5 text-volt-400" />Scan a Barcode</>}>
      <div className="space-y-4">
        <div className="relative h-56 rounded-xl bg-ink-900 border border-white/10 overflow-hidden">
          <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
          {phase === 'scanning' && (
            <>
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-ember-500 shadow-[0_0_12px_2px_rgba(242,87,27,0.6)] live-dot" />
              <div className="absolute inset-6 border-2 border-white/25 rounded-lg pointer-events-none" />
            </>
          )}
          {phase === 'starting' && (
            <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">Starting camera…</div>
          )}
          {phase === 'nocamera' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-slate-400">
              No camera access — allow camera permission, or type the barcode number below.
            </div>
          )}
        </div>

        {phase === 'scanning' && !lookup && (
          <p className="text-sm text-slate-400">Center the barcode in the frame — it reads automatically.</p>
        )}
        {lookup?.status === 'loading' && (
          <p className="text-sm text-slate-400">Looking up <span className="tabular-nums text-slate-200">{lookup.code}</span>…</p>
        )}
        {lookup?.status === 'missing' && (
          <p className="text-sm text-ember-400">
            <span className="tabular-nums">{lookup.code}</span> isn't in Open Food Facts. Try another item,
            or add it by hand from the Search tab.
          </p>
        )}
        {lookup?.status === 'error' && (
          <p className="text-sm text-ember-400">Couldn't reach the food database — check your connection and try again.</p>
        )}

        <div>
          <label className="label">Or type the barcode number</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              inputMode="numeric"
              placeholder="e.g. 038000138416"
              value={manual}
              onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter' && manualValid) handleCode(manual.trim()) }}
            />
            <button className="btn-ghost !px-4" disabled={!manualValid} onClick={() => handleCode(manual.trim())}>
              Look up
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Product data comes from Open Food Facts, a free open database. Packaged foods work best;
          produce usually has no barcode — search or quick-add those instead.
        </p>
      </div>
    </Modal>
  )
}
