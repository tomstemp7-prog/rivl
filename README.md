# Rivl: pricing-intelligence prototype

Enter a UK postcode and a business type, and see a map of nearby competitors and what they charge.

This is a **clickable design and UX prototype**. The businesses and prices are fictional and generated in the browser. There is no backend, no auth and no real checkout.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm run typecheck` | TypeScript only |

Requires Node 20 or newer.

## Try the funnel

1. Search **SL5 0AA** + **Gyms** (or any real UK postcode). Try `ZZ1` to see the friendly error state.
2. Click pins or list rows. Map and list stay in sync. Switch radius between 1, 3 and 5 miles. The 1 mile view usually shows the "widen the radius" empty state for some categories.
3. Add your own price in **Run a business here?** and a "You" pin drops onto the map.
4. The **Pro** upsell appears. Enter an email to reach the "You're on the list" state.
5. Press **`d`** at any time (outside a text field) to open the funnel debug panel. Every event is also logged to the browser console.

Results live in the URL (`?pc=SL50AA&cat=gyms&r=5`), so links are shareable and survive a refresh. Back and forward work too.

On screens narrower than 768px the results switch to a full-screen map with a swipeable bottom sheet. Drag or tap the handle to move between peek, half and full.

## How it works

- **Postcode lookup:** [postcodes.io](https://postcodes.io) (free, no key). Invalid or unknown postcodes show an inline error that suggests SL5 0AA. If the API can't be reached, the SL5 0AA example still works from a built-in fallback.
- **Map:** Leaflet via react-leaflet, with OpenStreetMap tiles. No API keys.
- **Mock data:** 15 invented businesses per category, scattered within about 5 miles of the searched postcode. Generation is seeded by postcode + category, so the same search always gives the same results.
- **Loading:** a simulated 600–800ms delay shows skeleton loaders.

## Structure

```
src/
  App.tsx                 Page flow: landing → loading → results; URL state; layout (desktop grid / mobile sheet)
  analytics.ts            track(): console + in-memory log for the debug panel
  mockData.ts             Categories, invented business names, seeded generator, price formatting
  lib/
    postcode.ts           postcodes.io lookup, validation, error copy
    stats.ts              Median, quartiles, histogram, below/near/above banding, percentile rank
    url.ts                Read/write ?pc=&cat=&r=
    hooks.ts              useCountUp, useMediaQuery
  components/
    SearchBar.tsx         Hero and compact variants
    ResultsSummary.tsx    Median, range, count, price-distribution bars (with count-up)
    PriceMap.tsx          Leaflet map, price-label pins, radius ring, "You" pin
    BusinessCard.tsx      Selected business card
    BusinessList.tsx      Sortable list (price / distance), synced with the map, empty state
    YourPriceCard.tsx     Give-to-get: add your price, see where you rank
    UpsellCard.tsx        Pro trial CTA, locked price-history teaser, success state
    BottomSheet.tsx       Mobile swipeable sheet
    InfoTip.tsx           Inline "?" answers ("Where do these prices come from?", etc.)
    DebugPanel.tsx        Funnel event log, toggled with "d"
    Skeletons.tsx         Loading placeholders
```

## Funnel events

| Event | When |
| --- | --- |
| `search_submitted` | Search form submitted (hero, header, example link, category switch) |
| `results_viewed` | Results rendered |
| `pin_clicked` | A business is selected from the map (`source: "map"`) or the list (`source: "list"`) |
| `price_added` | User adds their own price (includes `percentile`) |
| `upsell_viewed` | Pro card is at least 40% on screen |
| `trial_cta_clicked` | "Start free trial" pressed |
| `trial_submitted` | Valid email submitted |
| `radius_changed` | Radius chip changed (extra, useful for the funnel) |

Every event includes `category` and `radius`.

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| ink | `#15202B` | Text, dark surfaces, "near median" pins |
| signal | `#FF5A1F` | Primary actions, "above median" pins |
| mist | `#EEF1F4` | Cards |
| peach | `#FFE7DD` | Highlight backgrounds |
| below | `#2563C9` | "Below median" pins (blue vs orange stays readable for colour-blind users) |

Type is Inter (Google Fonts). Corners are 12–16px.
