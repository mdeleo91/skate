import { useRef, useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, EmptyState, Modal } from '../components/ui'

const VIEWS = ['Front', 'Side', 'Back']

export default function Photos() {
  const data = useData()
  const [view, setView] = useState('Front')
  const [compare, setCompare] = useState(false)
  const fileRef = useRef(null)
  if (!data) return null

  const photos = data.photos.filter((p) => p.view === view).sort((a, b) => b.date.localeCompare(a.date))

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => data.addPhoto({ view, dataUrl: reader.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="h-title">Progress Photos</h1>
          <p className="text-sm text-slate-500 mt-1">
            The mirror lies daily. Photos a month apart don't.
          </p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn-primary !px-4 shrink-0">+ Photo</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <div className="flex gap-1.5">
        {VIEWS.map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`chip !px-3 !py-1.5 ${view === v ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400'}`}>{v}</button>
        ))}
        {photos.length >= 2 && (
          <button onClick={() => setCompare(true)} className="chip !px-3 !py-1.5 bg-surge-500/15 text-surge-400 ml-auto">
            Compare
          </button>
        )}
      </div>

      {photos.length === 0 ? (
        <EmptyState emoji="📸" title={`No ${view.toLowerCase()} photos yet`}
          desc="Same spot, same light, same time of day. Once a month is plenty." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p) => (
            <Card key={p.id} className="!p-2">
              <img src={p.dataUrl} alt={`${p.view} on ${p.date}`} className="w-full aspect-[3/4] object-cover rounded-lg" />
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-xs text-slate-400">{p.date}</span>
                <button onClick={() => data.deletePhoto(p.id)} className="text-slate-600 hover:text-ember-400">×</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <SectionTitle>How to shoot these</SectionTitle>
        <p className="text-sm text-slate-400">
          Photos are stored locally in your browser only — they never leave this device in this build.
          Take them monthly, in the same spot with the same lighting, front / side / back. Comparison
          works best when the only thing that changed is you.
        </p>
      </Card>

      <Modal open={compare} onClose={() => setCompare(false)} title={`${view} — then vs now`}>
        {photos.length >= 2 && (
          <div className="grid grid-cols-2 gap-3">
            {[photos[photos.length - 1], photos[0]].map((p, i) => (
              <div key={p.id}>
                <img src={p.dataUrl} alt="" className="w-full aspect-[3/4] object-cover rounded-lg" />
                <div className="text-center text-xs mt-1.5">
                  <div className="font-semibold text-slate-200">{i === 0 ? 'Then' : 'Now'}</div>
                  <div className="text-slate-500">{p.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
