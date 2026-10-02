export interface Place {
  postcode: string
  lat: number
  lng: number
  area?: string
}

export type LookupError = 'empty' | 'format' | 'not_found' | 'network'

export class PostcodeError extends Error {
  constructor(public kind: LookupError) {
    super(kind)
  }
}

export const EXAMPLE_POSTCODE = 'SL5 0AA'

// Lets the suggested example keep working if postcodes.io can't be reached.
const OFFLINE_FALLBACK: Record<string, Place> = {
  SL50AA: { postcode: 'SL5 0AA', lat: 51.4053, lng: -0.6627, area: 'Windsor and Maidenhead' },
}

const UK_POSTCODE = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/

export const compactPostcode = (raw: string) => raw.replace(/\s+/g, '').toUpperCase()

/** "sl50aa" → "SL5 0AA" */
export function prettyPostcode(raw: string) {
  const c = compactPostcode(raw)
  return c.length > 3 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c
}

export async function lookupPostcode(raw: string): Promise<Place> {
  const compact = compactPostcode(raw)
  if (!compact) throw new PostcodeError('empty')
  if (!UK_POSTCODE.test(compact)) throw new PostcodeError('format')

  let res: Response
  try {
    res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`)
  } catch {
    if (OFFLINE_FALLBACK[compact]) return OFFLINE_FALLBACK[compact]
    throw new PostcodeError('network')
  }
  if (res.status === 404) throw new PostcodeError('not_found')
  if (!res.ok) {
    if (OFFLINE_FALLBACK[compact]) return OFFLINE_FALLBACK[compact]
    throw new PostcodeError('network')
  }
  const json = await res.json()
  const r = json.result
  if (!r || typeof r.latitude !== 'number') throw new PostcodeError('not_found')
  return { postcode: r.postcode, lat: r.latitude, lng: r.longitude, area: r.admin_district ?? undefined }
}

export const ERROR_COPY: Record<LookupError, string> = {
  empty: 'Pop in a postcode to get started.',
  format: "That doesn't look like a UK postcode.",
  not_found: "We couldn't find that postcode.",
  network: "We couldn't reach the postcode finder just now.",
}
