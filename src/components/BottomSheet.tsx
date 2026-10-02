import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Visible height of the sheet at each snap point, as a share of the viewport. */
export const SHEET_SNAPS = [0.28, 0.58, 0.9]

interface Props {
  snap: number
  onSnapChange: (snap: number) => void
  header: ReactNode
  children: ReactNode
}

function useViewportHeight() {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return h
}

/** Mobile bottom sheet: drag (or tap) the handle to move between peek, half and full. */
export function BottomSheet({ snap, onSnapChange, header, children }: Props) {
  const vh = useViewportHeight()
  const height = vh * SHEET_SNAPS[SHEET_SNAPS.length - 1]
  const restingY = height - vh * SHEET_SNAPS[snap]
  const [dragY, setDragY] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startOffset: number; lastY: number; lastT: number; v: number; moved: boolean } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button:not([data-sheet-handle]), a, input, select')) return
    drag.current = { startY: e.clientY, startOffset: restingY, lastY: e.clientY, lastT: e.timeStamp, v: 0, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.startY
    if (Math.abs(dy) > 4) d.moved = true
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    setDragY(Math.min(height - vh * SHEET_SNAPS[0] + 40, Math.max(-20, d.startOffset + dy)))
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      // A tap on the handle steps the sheet up, or back down from full.
      onSnapChange(snap === SHEET_SNAPS.length - 1 ? 0 : snap + 1)
      setDragY(null)
      return
    }
    const y = dragY ?? restingY
    // Project forward a little using the flick velocity, then pick the nearest snap.
    const projected = y + d.v * 180
    let best = 0
    SHEET_SNAPS.forEach((s, i) => {
      if (Math.abs(height - vh * s - projected) < Math.abs(height - vh * SHEET_SNAPS[best] - projected)) best = i
    })
    onSnapChange(best)
    setDragY(null)
  }

  const y = dragY ?? restingY

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1100] flex flex-col rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(21,32,43,0.18)]"
      style={{
        height,
        transform: `translateY(${y}px)`,
        transition: dragY === null ? 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
      }}
    >
      <div
        className="shrink-0 cursor-grab touch-none px-5 pt-2.5 pb-3 select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          data-sheet-handle
          aria-label={snap === SHEET_SNAPS.length - 1 ? 'Collapse list' : 'Expand list'}
          className="mx-auto mb-2 block h-5 w-16"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSnapChange(snap === SHEET_SNAPS.length - 1 ? 0 : snap + 1)
            }
          }}
        >
          <span className="mx-auto block h-1.5 w-11 rounded-full bg-line" />
        </button>
        {header}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(24px+env(safe-area-inset-bottom))]">{children}</div>
    </div>
  )
}
