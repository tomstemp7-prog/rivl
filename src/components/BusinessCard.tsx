import { formatChecked, formatPrice, type Business, type Category } from '../mockData'
import { BAND_LABEL, band } from '../lib/stats'

interface Props {
  business: Business
  category: Category
  median: number
  onClose: () => void
  className?: string
}

const TAG_STYLE = {
  below: 'bg-[#E2ECFB] text-[#1D4E9E]',
  near: 'bg-mist text-ink',
  above: 'bg-peach text-rust',
} as const

export function BusinessCard({ business, category, median, onClose, className }: Props) {
  const b = band(business.price, median)
  const fmt = (v: number) => formatPrice(v, category.pence)
  const diff = business.price - median
  const diffText =
    Math.abs(diff) < (category.pence ? 0.05 : 1)
      ? 'Same as the area median'
      : `${fmt(Math.abs(diff))} ${diff > 0 ? 'above' : 'below'} the area median`

  return (
    <article
      aria-label={business.name}
      className={`animate-fade-up z-[1000] w-[min(320px,calc(100%-24px))] rounded-2xl bg-white p-4 shadow-lift ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-extrabold">{business.name}</h3>
          <p className="text-[13px] text-muted">
            {business.distance.toFixed(1)} miles away · {business.street}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mist hover:bg-line"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-[30px] leading-none font-extrabold tracking-tight">{fmt(business.price)}</span>
        <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${TAG_STYLE[b]}`}>{BAND_LABEL[b]}</span>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        {category.unit} · {diffText}
      </p>
      <ul className="mt-3 space-y-1.5 border-t border-mist pt-3">
        {business.extras.map((x) => (
          <li key={x.label} className="flex justify-between text-sm">
            <span className="text-ink-soft">{x.label}</span>
            <span className="font-bold tabular-nums">{fmt(x.price)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Last checked {formatChecked(business.lastCheckedDays)}</p>
    </article>
  )
}
