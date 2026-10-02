import { useEffect, useRef, useState } from 'react'
import { track } from '../analytics'
import type { Category } from '../mockData'
import { InfoTip } from './InfoTip'

interface Props {
  category: Category
  radius: number
}

const PERKS = ['Track up to 10 competitors', 'An email the day a price changes', '12 months of price history']

export function UpsellCard({ category, radius }: Props) {
  const [email, setEmail] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const viewed = useRef(false)

  // Count the upsell as viewed once it's actually on screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewed.current) {
          viewed.current = true
          track('upsell_viewed', { category: category.id, radius })
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    track('trial_cta_clicked', { category: category.id, radius })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setInvalid(true)
      return
    }
    setDone(true)
    track('trial_submitted', { category: category.id, radius })
  }

  return (
    <section ref={ref} aria-label="Rivl Pro" className="animate-fade-up rounded-2xl bg-ink p-5 text-white sm:p-6">
      {done ? (
        <div className="animate-fade-up py-2 text-center" role="status">
          <div className="mx-auto mb-3 flex size-13 items-center justify-center rounded-full bg-signal">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h3 className="text-[22px] font-extrabold">You're on the list</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#D7DEE5]">
            We'll email <strong className="text-white">{email.trim()}</strong> when your free trial is ready. Nothing to pay today.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-signal px-2.5 py-1 text-xs font-extrabold tracking-wide">PRO · £29/MO</span>
            <InfoTip question="Is it free?" tone="dark" align="right">
              Searching is free, always, with no sign-up. Pro is optional: 14 days free, then £29 a month. Cancel any time.
            </InfoTip>
          </div>
          <h3 className="mt-3 text-[22px] leading-tight font-extrabold tracking-tight">Get alerted when a competitor changes price</h3>
          <ul className="mt-3 space-y-1.5 text-[15px] text-[#D7DEE5]">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {p}
              </li>
            ))}
          </ul>

          <LockedHistory />

          <form onSubmit={submit} className="mt-4 flex flex-col gap-2" noValidate>
            <label htmlFor="trial-email" className="text-[13px] text-[#B9C3CD]">Your email</label>
            <input
              id="trial-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setInvalid(false)
              }}
              placeholder="you@yourbusiness.co.uk"
              aria-invalid={invalid}
              className="h-12 rounded-xl bg-white px-3.5 text-base font-medium text-ink outline-none placeholder:text-[#8A96A3] focus:ring-2 focus:ring-signal"
            />
            {invalid && <p role="alert" className="text-sm text-[#FFB79C]">That email doesn't look quite right.</p>}
            <button type="submit" className="h-[50px] rounded-xl bg-signal text-[17px] font-extrabold transition hover:bg-signal-dark active:scale-[0.98]">
              Start free trial
            </button>
          </form>
          <p className="mt-2.5 text-[13px] text-[#B9C3CD]">14 days free, then £29/mo. No card needed to start.</p>
        </>
      )}
    </section>
  )
}

function LockedHistory() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl bg-[#22303D] p-3">
      <p className="mb-1.5 text-[13px] text-[#B9C3CD]">Price history · last 12 months</p>
      <svg viewBox="0 0 300 70" className="h-[70px] w-full blur-[3px]" aria-hidden>
        <polyline points="0,50 25,48 50,44 75,46 100,38 125,40 150,30 175,34 200,26 225,28 250,20 275,22 300,14" fill="none" stroke="#FF5A1F" strokeWidth="3" />
        <polyline points="0,58 25,56 50,57 75,52 100,54 125,49 150,50 175,46 200,47 225,42 250,44 275,40 300,38" fill="none" stroke="#8FA3B5" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-bold">
        <span className="flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Unlock with Pro
        </span>
      </div>
    </div>
  )
}
