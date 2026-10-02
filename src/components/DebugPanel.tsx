import { useEffect, useState, useSyncExternalStore } from 'react'
import { FUNNEL_STEPS, clearEvents, getEvents, subscribe } from '../analytics'

/** On-screen funnel log. Press "d" (outside a text field) to toggle. */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const events = useSyncExternalStore(subscribe, getEvents)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey) setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  const reached = new Set(events.map((e) => e.name))

  return (
    <aside
      aria-label="Funnel debug panel"
      className="fixed right-3 bottom-3 z-[2000] flex max-h-[70vh] w-[min(360px,calc(100vw-24px))] flex-col rounded-2xl bg-ink text-white shadow-lift"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-bold">Funnel events</h2>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={clearEvents} className="text-white/70 underline hover:text-white">Clear</button>
          <button type="button" onClick={() => setOpen(false)} className="text-[#FFB79C] underline">Hide (d)</button>
        </div>
      </header>
      <ol className="flex flex-wrap gap-1 border-b border-white/10 px-4 py-3">
        {FUNNEL_STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${reached.has(s) ? 'bg-signal text-white' : 'bg-white/10 text-white/50'}`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-2 font-mono text-xs">
        {events.length === 0 && <li className="py-2 text-white/60">No events yet. Run a search.</li>}
        {events.map((e) => (
          <li key={e.id} className="border-b border-white/5 py-2">
            <div className="flex justify-between gap-2">
              <span className="font-bold text-[#FF8A5E]">{e.name}</span>
              <span className="text-white/40">{e.at.toLocaleTimeString('en-GB')}</span>
            </div>
            <div className="mt-0.5 break-all text-white/70">{JSON.stringify(e.props)}</div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
