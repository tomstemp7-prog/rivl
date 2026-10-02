export type Band = 'below' | 'near' | 'above'

/** Within ±7% of the median counts as "near". */
const NEAR = 0.07

export function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function band(price: number, median: number): Band {
  if (price < median * (1 - NEAR)) return 'below'
  if (price > median * (1 + NEAR)) return 'above'
  return 'near'
}

export const BAND_COLOUR: Record<Band, string> = {
  below: '#2563C9',
  near: '#15202B',
  above: '#FF5A1F',
}

export const BAND_LABEL: Record<Band, string> = {
  below: 'Below median',
  near: 'Near median',
  above: 'Above median',
}

export interface PriceStats {
  count: number
  median: number
  low: number
  high: number
  q1: number
  q3: number
  bins: { from: number; to: number; count: number }[]
}

export function priceStats(prices: number[], binCount = 8): PriceStats {
  const sorted = [...prices].sort((a, b) => a - b)
  const low = sorted[0] ?? 0
  const high = sorted[sorted.length - 1] ?? 0
  const span = Math.max(high - low, 0.0001)
  const bins = Array.from({ length: binCount }, (_, i) => ({
    from: low + (span * i) / binCount,
    to: low + (span * (i + 1)) / binCount,
    count: 0,
  }))
  for (const p of sorted) bins[Math.min(binCount - 1, Math.floor(((p - low) / span) * binCount))].count++
  return {
    count: sorted.length,
    median: quantile(sorted, 0.5),
    low,
    high,
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    bins,
  }
}

/** Share of businesses (0–100) priced below `price`; ties count as half. */
export function percentRank(prices: number[], price: number) {
  if (!prices.length) return 50
  const below = prices.filter((p) => p < price).length
  const equal = prices.filter((p) => p === price).length
  return Math.round(((below + equal / 2) / prices.length) * 100)
}
