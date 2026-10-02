import { useState } from 'react'
import { formatPrice, type Category } from '../mockData'
import { percentRank, type PriceStats } from '../lib/stats'

interface Props {
  category: Category
  stats: PriceStats
  prices: number[]
  yourPrice: number | null
  onSubmit: (price: number) => void
  onEdit: () => void
}

function position(pct: number) {
  if (pct <= 35) return { kind: 'cheap' as const, share: Math.max(10, Math.ceil(pct / 10) * 10) }
  if (pct < 65) return { kind: 'median' as const, share: 50 }
  return { kind: 'pricey' as const, share: Math.max(10, Math.ceil((100 - pct) / 10) * 10) }
}

export function YourPriceCard({ category, stats, prices, yourPrice, onSubmit, onEdit }: Props) {
  const [value, setValue] = useState(yourPrice !== null ? String(yourPrice) : '')
  const [invalid, setInvalid] = useState(false)
  const fmt = (v: number) => formatPrice(v, category.pence)
  const example = category.pence ? stats.median.toFixed(2) : String(Math.round(stats.median))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseFloat(value.replace(/[£,\s]/g, ''))
    if (!Number.isFinite(n) || n <= 0 || n > 10000) {
      setInvalid(true)
      return
    }
    onSubmit(Math.round(n * 100) / 100)
  }

  if (yourPrice === null) {
    return (
      <section aria-label="Add your price" className="rounded-2xl border-2 border-peach bg-white p-5 shadow-soft sm:p-6">
        <h3 className="text-xl font-extrabold tracking-tight">Run a business here?</h3>
        <p className="mt-1 mb-4 text-[15px] leading-relaxed text-ink-soft">
          Add your price for a {category.unit} to see where you rank. It's only shown to you.
        </p>
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <div className="flex h-12 min-w-0 flex-1 basis-32 items-center rounded-xl border border-line px-3 focus-within:border-ink">
            <span className="font-bold text-muted" aria-hidden>£</span>
            <label htmlFor="your-price" className="sr-only">Your price for a {category.unit}, in pounds</label>
            <input
              id="your-price"
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setInvalid(false)
              }}
              placeholder={example}
              aria-invalid={invalid}
              className="w-full min-w-0 bg-transparent pl-1 text-lg font-bold outline-none placeholder:font-semibold placeholder:text-[#8A96A3]"
            />
          </div>
          <button type="submit" className="h-12 rounded-xl bg-signal px-5 text-base font-extrabold text-white transition hover:bg-signal-dark active:scale-[0.98]">
            See where I sit
          </button>
        </form>
        {invalid && <p role="alert" className="mt-2 text-sm text-rust">Pop in a price as a number, like {example}.</p>}
      </section>
    )
  }

  const pct = percentRank(prices, yourPrice)
  const pos = position(pct)
  const range = `${fmt(stats.q1)}–${fmt(stats.q3)}`
  const headline =
    pos.kind === 'cheap'
      ? `You're in the cheapest ${pos.share}%`
      : pos.kind === 'median'
        ? "You're around the median"
        : `You're in the top ${pos.share}% on price`
  const nudge =
    pos.kind === 'cheap'
      ? `Most ${category.plural} nearby charge ${range}. You may have room to nudge your price up without losing customers.`
      : pos.kind === 'median'
        ? 'You sit right where most of the market does, so a clear reason to choose you (hours, perks, reviews) matters more than price.'
        : `You're priced above most ${category.plural} nearby. That works when customers can see why, so make your extras easy to spot.`

  return (
    <section aria-label="Where you sit" aria-live="polite" className="animate-fade-up rounded-2xl border-2 border-peach bg-white p-5 shadow-soft sm:p-6">
      <p className="text-[13px] font-bold tracking-wider text-muted uppercase">Your price · {fmt(yourPrice)}</p>
      <h3 className="mt-1.5 text-[26px] leading-tight font-extrabold tracking-tight">{headline}</h3>
      <p className="mt-2 mb-4 text-[15px] leading-relaxed text-ink-soft">{nudge}</p>
      <div className="relative h-2.5 rounded-full bg-gradient-to-r from-below via-ink to-signal" aria-hidden>
        <span
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-signal bg-white transition-[left] duration-700 ease-out"
          style={{ left: `${Math.min(97, Math.max(3, pct))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>Cheapest</span>
        <span>Median {fmt(stats.median)}</span>
        <span>Priciest</span>
      </div>
      <button type="button" onClick={onEdit} className="mt-3 min-h-8 text-sm font-semibold underline underline-offset-2">
        Change my price
      </button>
    </section>
  )
}
