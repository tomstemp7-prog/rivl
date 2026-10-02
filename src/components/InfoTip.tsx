import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface Props {
  /** The question, used as the button's accessible name, e.g. "How fresh is this?" */
  question: string
  children: ReactNode
  /** Show the question as text next to the "?" */
  showQuestion?: boolean
  align?: 'left' | 'right'
  tone?: 'light' | 'dark'
}

/** Small "?" that answers a likely question inline, so nobody has to leave the page. */
export function InfoTip({ question, children, showQuestion, align = 'left', tone = 'light' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const dark = tone === 'dark'

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={showQuestion ? undefined : question}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-7 items-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors ${
          dark ? 'text-white/80 hover:text-white' : 'text-muted hover:text-ink'
        }`}
      >
        <span
          aria-hidden
          className={`flex size-6 items-center justify-center rounded-full border text-[12px] font-bold ${
            dark ? 'border-white/30' : 'border-line bg-white'
          }`}
        >
          ?
        </span>
        {showQuestion && <span className="underline decoration-dotted underline-offset-2">{question}</span>}
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className={`animate-fade-up absolute top-full z-[1200] mt-2 w-64 rounded-xl bg-ink p-3.5 text-left text-sm leading-relaxed font-normal text-white shadow-lift ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <strong className="mb-1 block font-semibold">{question}</strong>
          {children}
        </span>
      )}
    </span>
  )
}
