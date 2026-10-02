import { useEffect, useRef } from 'react'
import { formatChecked, formatPrice, type Business, type Category } from '../mockData'
import { BAND_COLOUR, band } from '../lib/stats'
import type { Radius } from '../lib/url'

export type SortKey = 'price' | 'distance'

interface Props {
  businesses: Business[]
  category: Category
  median: number
  sort: SortKey
  onSortChange: (s: SortKey) => void
  selectedId: string | null
  onSelect: (id: string) => void
  radius: Radius
  onWiden: () => void
  nextCategory: Category
  onTryCategory: () => void
  /** Desktop gives the list its own scroll box; on mobile the sheet scrolls. */
  scrollable?: boolean
}

export function BusinessList(props: Props) {
  const { businesses, category, median, sort, onSortChange, selectedId, onSelect, radius, onWiden, nextCategory, onTryCategory, scrollable } = props
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())

  const sorted = [...businesses].sort((a, b) => (sort === 'price' ? a.price - b.price : a.distance - b.distance))

  // Keep the list in step with the map: scroll the selected row into view.
  useEffect(() => {
    if (selectedId) itemRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <section aria-label="Businesses" className="flex min-h-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold">{businesses.length} nearby</h3>
        <div role="group" aria-label="Sort by" className="flex rounded-full bg-mist p-[3px]">
          {(['price', 'distance'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sort === s}
              onClick={() => onSortChange(s)}
              className={`h-9 rounded-full px-3.5 text-[13px] font-semibold capitalize transition ${
                sort === s ? 'bg-white shadow-[0_1px_4px_rgba(21,32,43,0.15)]' : 'text-muted hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-2xl bg-mist p-5 text-[15px] leading-relaxed">
          <p className="font-extrabold">No {category.plural} within {radius} mile{radius === 1 ? '' : 's'}</p>
          <p className="mt-1 mb-3 text-ink-soft">Widen the search to see more of your local market.</p>
          <button type="button" onClick={onWiden} className="h-11 rounded-xl bg-signal px-4 text-[15px] font-extrabold text-white hover:bg-signal-dark">
            Show {radius === 1 ? 3 : 5} miles
          </button>
          <button type="button" onClick={onTryCategory} className="ml-3 text-sm font-semibold underline underline-offset-2">
            or try {nextCategory.plural}
          </button>
        </div>
      ) : (
        <ul className={`space-y-2 ${scrollable ? 'min-h-0 flex-1 overflow-y-auto pr-1 pb-1' : ''}`}>
          {sorted.map((b) => {
            const selected = b.id === selectedId
            return (
              <li key={b.id}>
                <button
                  ref={(el) => {
                    if (el) itemRefs.current.set(b.id, el)
                    else itemRefs.current.delete(b.id)
                  }}
                  type="button"
                  onClick={() => onSelect(b.id)}
                  aria-current={selected}
                  className={`flex w-full items-center gap-3 rounded-[14px] border-2 px-3.5 py-3 text-left transition-colors ${
                    selected ? 'border-signal bg-peach' : 'border-mist bg-white hover:border-line'
                  }`}
                >
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: BAND_COLOUR[band(b.price, median)] }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{b.name}</span>
                    <span className="block text-[13px] text-muted">
                      {b.distance.toFixed(1)} mi · checked {formatChecked(b.lastCheckedDays)}
                    </span>
                  </span>
                  <span className="text-[17px] font-extrabold tabular-nums">{formatPrice(b.price, category.pence)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {businesses.length > 0 && (
        <p className="mt-3 text-sm text-ink-soft">
          {radius < 5 ? (
            <>
              Want the bigger picture?{' '}
              <button type="button" onClick={onWiden} className="font-bold text-ink underline underline-offset-2">
                Show {radius === 1 ? 3 : 5} miles
              </button>
            </>
          ) : (
            <>
              Curious about another trade?{' '}
              <button type="button" onClick={onTryCategory} className="font-bold text-ink underline underline-offset-2">
                Try {nextCategory.plural}
              </button>
            </>
          )}
        </p>
      )}
    </section>
  )
}
