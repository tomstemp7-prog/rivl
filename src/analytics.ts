// Tiny funnel tracker: logs to the console and keeps an in-memory log for the
// on-screen debug panel (press "d" to toggle it).

export type FunnelEvent =
  | 'search_submitted'
  | 'results_viewed'
  | 'pin_clicked'
  | 'price_added'
  | 'upsell_viewed'
  | 'trial_cta_clicked'
  | 'trial_submitted'
  | 'radius_changed'

export interface TrackedEvent {
  id: number
  name: FunnelEvent
  props: Record<string, unknown>
  at: Date
}

export const FUNNEL_STEPS: FunnelEvent[] = [
  'search_submitted',
  'results_viewed',
  'pin_clicked',
  'price_added',
  'upsell_viewed',
  'trial_cta_clicked',
  'trial_submitted',
]

let events: TrackedEvent[] = []
let nextId = 1
const listeners = new Set<() => void>()

export function track(name: FunnelEvent, props: Record<string, unknown> = {}) {
  const event: TrackedEvent = { id: nextId++, name, props, at: new Date() }
  events = [event, ...events].slice(0, 100)
  console.log(`%c[rivl] ${name}`, 'color:#FF5A1F;font-weight:bold', props)
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getEvents = () => events

export function clearEvents() {
  events = []
  listeners.forEach((l) => l())
}
