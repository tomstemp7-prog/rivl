// Fictional businesses for the prototype. Every name here is invented.
// Businesses are generated around whatever postcode is searched, seeded by
// postcode + category so the same search always shows the same results.

export type CategoryId = 'gyms' | 'hair' | 'barbers' | 'beauty' | 'dogs' | 'cafes'

export interface Category {
  id: CategoryId
  label: string
  plural: string
  /** The headline service every business is compared on. */
  unit: string
  /** Typical price and how far prices spread either side. */
  base: number
  spread: number
  /** Show pence (cafés) or whole pounds. */
  pence: boolean
  names: string[]
  /** Other prices shown on the business card, as a multiple of the headline price. */
  extras: [label: string, multiple: number][]
}

export const CATEGORIES: Category[] = [
  {
    id: 'gyms',
    label: 'Gyms',
    plural: 'gyms',
    unit: 'monthly membership',
    base: 34,
    spread: 13,
    pence: false,
    names: [
      'Ironworks Fitness', 'The Lift House', 'Pulse Studio', 'Kinetic Club', 'Forge & Flow',
      'Northfield Strength', 'Peak Form Gym', 'The Movement Shed', 'Riverside Fitness Co', 'Bolt Training',
      'Core Collective', 'Steel Valley Gym', 'Ember Athletic', 'Summit Health Club', 'Fettle Fitness',
    ],
    extras: [['Day pass', 0.3], ['Off-peak membership', 0.72], ['Personal training session', 1.15]],
  },
  {
    id: 'hair',
    label: 'Hair salons',
    plural: 'hair salons',
    unit: "women's cut & blow-dry",
    base: 52,
    spread: 17,
    pence: false,
    names: [
      'Strand & Co', 'The Gloss Room', 'Mane Street', 'Willow Hair Studio', 'Blush & Blowdry',
      'Lark Salon', 'The Cutting Rooms', 'Halo Hair', 'Ivy Lane Hair', 'Copper Comb',
      'Silk & Shears', 'Bramble Hair', 'The Hair Loft', 'Fern Salon', 'Velvet Tresses',
    ],
    extras: [['Blow-dry only', 0.55], ['Full head colour', 1.6], ["Kids' cut", 0.38]],
  },
  {
    id: 'barbers',
    label: 'Barbers',
    plural: 'barbers',
    unit: "men's cut",
    base: 20,
    spread: 7,
    pence: false,
    names: [
      'Old Town Barbers', 'Fade Republic', 'Sharp & Son', 'The Blade Room', 'Clipper Club',
      'Gents of Elm Street', 'Edgeline Co', 'Crown Cuts', "The Barber's Chair", 'Brushwood Barbers',
      'Fellows Grooming', 'Union Cuts', 'Straight Line Barbers', 'Hatch Barbers', 'Kingsway Cuts',
    ],
    extras: [['Skin fade', 1.2], ['Beard trim', 0.55], ["Kids' cut", 0.72]],
  },
  {
    id: 'beauty',
    label: 'Beauty salons',
    plural: 'beauty salons',
    unit: 'gel manicure',
    base: 30,
    spread: 9,
    pence: false,
    names: [
      'Glow Theory', 'Lumen Skin', 'The Beauty Nook', 'Petal Rooms', 'Radiance Studio',
      'Bloom Aesthetics', 'Pure Polish', 'Serene Skin Bar', 'Honey Beauty Lounge', 'Lotus Treatments',
      'Calm & Co', 'Dewdrop Beauty', 'Saffron Rooms', 'Opal Beauty', 'Primrose Studio',
    ],
    extras: [['Eyebrow shape', 0.5], ['Facial (60 min)', 1.9], ['Lash lift', 1.4]],
  },
  {
    id: 'dogs',
    label: 'Dog groomers',
    plural: 'dog groomers',
    unit: 'full dog groom',
    base: 48,
    spread: 14,
    pence: false,
    names: [
      'Wag & Wash', 'The Pampered Pooch', 'Scruffs to Fluffs', 'Muddy Paws Spa', 'Barkley Lane',
      'Happy Tails Grooming', 'The Dog Parlour', 'Fur Real Grooming', 'Snip & Wag', 'Bubbles & Barks',
      'Lead & Lather', 'Tidy Tails', 'The Grooming Shed', 'Paws for Thought', 'Waggle Room',
    ],
    extras: [['Bath & brush', 0.6], ['Nail clip', 0.2], ['Puppy intro groom', 0.5]],
  },
  {
    id: 'cafes',
    label: 'Cafés',
    plural: 'cafés',
    unit: 'flat white',
    base: 3.4,
    spread: 0.6,
    pence: true,
    names: [
      'Bean & Bramble', 'The Grindstone', 'Kettle & Crumb', 'Little Roast', 'Oak Leaf Coffee',
      'Copper Cup', 'The Steam Room', 'Flour & Fable', 'Second Shot', 'The Morning Post',
      'Cobble Coffee', 'Hearth Café', 'Tin Mug', "Wren's Café", 'Common Ground Coffee',
    ],
    extras: [['Americano', 0.85], ['Latte', 1.06], ['Croissant', 0.95]],
  },
]

export const getCategory = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]

export const isCategoryId = (id: string | null): id is CategoryId =>
  !!id && CATEGORIES.some((c) => c.id === id)

export interface Business {
  id: string
  name: string
  street: string
  lat: number
  lng: number
  /** Miles from the searched postcode. */
  distance: number
  price: number
  extras: { label: string; price: number }[]
  lastCheckedDays: number
}

const STREETS = [
  'High Street', 'Station Road', 'Church Road', 'Market Square', 'Park Lane',
  'London Road', 'Mill Lane', 'Victoria Road', 'The Parade', 'King Street',
]

/** Small deterministic PRNG (mulberry32) seeded from a string. */
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const roundPrice = (v: number, pence: boolean) =>
  pence ? Math.round(v * 20) / 20 : Math.max(1, Math.round(v))

export function generateBusinesses(
  postcode: string,
  center: { lat: number; lng: number },
  categoryId: CategoryId,
): Business[] {
  const cat = getCategory(categoryId)
  const rand = seeded(`${postcode.replace(/\s/g, '').toUpperCase()}|${categoryId}`)
  const milesPerLat = 69
  const milesPerLng = 69 * Math.cos((center.lat * Math.PI) / 180)

  return cat.names.map((name, i) => {
    // Bias slightly towards the centre so the 1 mile view usually has a few results.
    const distance = 0.15 + 4.75 * Math.pow(rand(), 0.8)
    const bearing = rand() * Math.PI * 2
    // Roughly bell-shaped spread around the category's typical price.
    const noise = (rand() + rand() + rand() - 1.5) / 1.5
    const price = roundPrice(cat.base + noise * cat.spread, cat.pence)
    return {
      id: `${categoryId}-${i}`,
      name,
      street: STREETS[Math.floor(rand() * STREETS.length)],
      lat: center.lat + (Math.cos(bearing) * distance) / milesPerLat,
      lng: center.lng + (Math.sin(bearing) * distance) / milesPerLng,
      distance,
      price,
      extras: cat.extras.map(([label, multiple]) => ({ label, price: roundPrice(price * multiple, cat.pence) })),
      lastCheckedDays: 1 + Math.floor(rand() * 9),
    }
  })
}

export const formatPrice = (value: number, pence: boolean) =>
  pence ? `£${value.toFixed(2)}` : `£${Math.round(value)}`

export const formatChecked = (days: number) =>
  days === 1 ? 'yesterday' : `${days} days ago`
