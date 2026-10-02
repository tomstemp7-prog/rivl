import { isCategoryId, type CategoryId } from '../mockData'

export type Radius = 1 | 3 | 5
export const RADII: Radius[] = [1, 3, 5]

export interface UrlState {
  pc: string
  cat: CategoryId | null
  r: Radius
}

export function readUrl(): UrlState {
  const p = new URLSearchParams(window.location.search)
  const r = Number(p.get('r'))
  const cat = p.get('cat')
  return {
    pc: p.get('pc') ?? '',
    cat: isCategoryId(cat) ? cat : null,
    r: (RADII as number[]).includes(r) ? (r as Radius) : 5,
  }
}

/** Keeps ?pc=SL50AA&cat=gyms&r=5 in the address bar so results are shareable. */
export function writeUrl(state: Partial<UrlState> | null, mode: 'push' | 'replace' = 'replace') {
  const url = new URL(window.location.href)
  if (state === null) {
    url.search = ''
  } else {
    if (state.pc !== undefined) url.searchParams.set('pc', state.pc.replace(/\s+/g, '').toUpperCase())
    if (state.cat) url.searchParams.set('cat', state.cat)
    if (state.r !== undefined) url.searchParams.set('r', String(state.r))
  }
  if (url.href === window.location.href) return
  if (mode === 'push') window.history.pushState(null, '', url)
  else window.history.replaceState(null, '', url)
}
