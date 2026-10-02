import { useCountUp } from '../lib/hooks'
import { BAND_COLOUR, band, type PriceStats } from '../lib/stats'
import { formatPrice, type Category } from '../mockData'
import { InfoTip } from './InfoTip'

interface Props {
  stats: PriceStats
  category: Category
  yourPrice: number | null
  compact?: boolean
}

export function ResultsSummary({ stats, category, yourPrice, compact }: Props) {
  const median = useCountUp(stats.median)
  const low = useCountUp(stats.low)
  const high = useCountUp(stats.high)
  const fmt = (v: number) => formatPrice(v, category.pence)
  const maxBin = Math.max(1, ...stats.bins.map((b) => b.count))
  const span = Math.max(stats.high - stats.low, 0.0001)
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - stats.low) / span) * 100))

  if (!stats.count) return null

  return (
    <section aria-label="Price summary" className={`rounded-2xl bg-mist ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold tracking-wider text-muted uppercase">Area median</h3>
        <InfoTip question="Where do these prices come from?" align="right">
          We check public price lists on business websites and booking pages, then compare one like-for-like
          service, here a {category.unit}.
        </InfoTip>
      </div>
      <p className={`font-extrabold tracking-[-0.04em] tabular-nums ${compact ? 'text-4xl' : 'text-[56px] leading-[1.1]'}`}>
        {fmt(median)}
      </p>
      <p className="text-[15px] text-ink-soft">for a {category.unit}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-white px-3.5 py-3">
          <dt className="text-[13px] text-muted">Range</dt>
          <dd className={`font-bold whitespace-nowrap tabular-nums ${category.pence ? 'text-lg' : 'text-xl'}`}>
            {fmt(low)}–{fmt(high)}
          </dd>
        </div>
        <div className="rounded-xl bg-white px-3.5 py-3">
          <dt className="text-[13px] text-muted">Businesses</dt>
          <dd className="text-xl font-bold">{stats.count} found</dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="mb-2 text-[13px] text-muted">Where prices cluster</p>
        <div className="relative">
          <div className="flex h-14 items-end gap-1" aria-hidden>
            {stats.bins.map((b, i) => (
              <div
                key={i}
                className="min-h-1 flex-1 rounded-t-md rounded-b-sm transition-[height] duration-700 ease-out"
                style={{
                  height: `${(b.count / maxBin) * 100}%`,
                  background: b.count ? BAND_COLOUR[band((b.from + b.to) / 2, stats.median)] : '#D9DFE5',
                }}
                title={`${b.count} at ${fmt(b.from)}–${fmt(b.to)}`}
              />
            ))}
          </div>
          {yourPrice !== null && (
            <div
              className="animate-fade-up absolute -top-2 bottom-0 w-0.5 bg-signal"
              style={{ left: `${pos(yourPrice)}%` }}
              aria-label={`Your price ${fmt(yourPrice)}`}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-md bg-signal px-1.5 text-[11px] font-bold text-white">
                You
              </span>
            </div>
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
          <span>{fmt(stats.low)}</span>
          <span>{fmt(stats.high)}</span>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-soft">
        {(['below', 'near', 'above'] as const).map((b) => (
          <li key={b} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: BAND_COLOUR[b] }} />
            {b === 'below' ? 'Below median' : b === 'near' ? 'Near median' : 'Above median'}
          </li>
        ))}
      </ul>
    </section>
  )
}
