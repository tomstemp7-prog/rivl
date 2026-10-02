import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { track } from './analytics'
import { CATEGORIES, generateBusinesses, getCategory, formatPrice, type Business, type CategoryId } from './mockData'
import { ERROR_COPY, EXAMPLE_POSTCODE, PostcodeError, lookupPostcode, prettyPostcode, type Place } from './lib/postcode'
import { percentRank, priceStats } from './lib/stats'
import { RADII, readUrl, writeUrl, type Radius } from './lib/url'
import { useMediaQuery } from './lib/hooks'
import { SearchBar } from './components/SearchBar'
import { ResultsSummary } from './components/ResultsSummary'
import { PriceMap } from './components/PriceMap'
import { BusinessList, type SortKey } from './components/BusinessList'
import { BusinessCard } from './components/BusinessCard'
import { YourPriceCard } from './components/YourPriceCard'
import { UpsellCard } from './components/UpsellCard'
import { BottomSheet, SHEET_SNAPS } from './components/BottomSheet'
import { ResultsSkeleton } from './components/Skeletons'
import { DebugPanel } from './components/DebugPanel'
import { InfoTip } from './components/InfoTip'

type Phase = 'landing' | 'loading' | 'results'

interface Result {
  id: number
  place: Place
  categoryId: CategoryId
  businesses: Business[]
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const initial = useMemo(readUrl, [])
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [phase, setPhase] = useState<Phase>(initial.pc && initial.cat ? 'loading' : 'landing')
  const [postcode, setPostcode] = useState(initial.pc ? prettyPostcode(initial.pc) : '')
  const [categoryId, setCategoryId] = useState<CategoryId>(initial.cat ?? 'gyms')
  const [radius, setRadius] = useState<Radius>(initial.r)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('price')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)
  const [yourPrices, setYourPrices] = useState<Partial<Record<CategoryId, number>>>({})
  const [sheetSnap, setSheetSnap] = useState(1)
  const [searching, setSearching] = useState(false)
  const requestId = useRef(0)
  const radiusRef = useRef(radius)
  radiusRef.current = radius
  const hasResult = useRef(false)

  const search = useCallback(async (pc: string, cat: CategoryId, history: 'push' | 'replace' | 'none' = 'push') => {
    const id = ++requestId.current
    const props = { category: cat, radius: radiusRef.current, postcode: prettyPostcode(pc) }
    track('search_submitted', props)
    setError(null)
    setPhase('loading')
    setSearching(true)
    try {
      // Simulated 600–800ms so the skeletons have a moment to show.
      const [place] = await Promise.all([lookupPostcode(pc), wait(600 + Math.random() * 200)])
      if (id !== requestId.current) return
      const businesses = generateBusinesses(place.postcode, place, cat)
      setResult({ id, place, categoryId: cat, businesses })
      hasResult.current = true
      setPostcode(place.postcode)
      setCategoryId(cat)
      setSelectedId(null)
      setSheetSnap(1)
      setPhase('results')
      if (history !== 'none') writeUrl({ pc: place.postcode, cat, r: radiusRef.current }, history)
      const count = businesses.filter((b) => b.distance <= radiusRef.current).length
      track('results_viewed', { ...props, postcode: place.postcode, count })
    } catch (e) {
      if (id !== requestId.current) return
      const kind = e instanceof PostcodeError ? e.kind : 'network'
      setError(ERROR_COPY[kind])
      setPhase(hasResult.current ? 'results' : 'landing')
    } finally {
      if (id === requestId.current) setSearching(false)
    }
  }, [])

  // Restore a shared link (?pc=SL50AA&cat=gyms) on first load, and follow back/forward.
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (initial.pc && initial.cat) search(initial.pc, initial.cat, 'none')
    const onPop = () => {
      const s = readUrl()
      setRadius(s.r)
      if (s.pc && s.cat) {
        setPostcode(prettyPostcode(s.pc))
        setCategoryId(s.cat)
        search(s.pc, s.cat, 'none')
      } else {
        requestId.current++
        setPhase('landing')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const submit = () => search(postcode, categoryId)
  const useExample = () => {
    setPostcode(EXAMPLE_POSTCODE)
    search(EXAMPLE_POSTCODE, categoryId)
  }
  const goHome = () => {
    requestId.current++
    setPhase('landing')
    setError(null)
    writeUrl(null, 'push')
  }

  // ----- derived results -----
  const category = getCategory(result?.categoryId ?? categoryId)
  const visible = useMemo(() => (result ? result.businesses.filter((b) => b.distance <= radius) : []), [result, radius])
  const prices = useMemo(() => visible.map((b) => b.price), [visible])
  const stats = useMemo(() => priceStats(prices), [prices])
  const yourPrice = result ? (yourPrices[result.categoryId] ?? null) : null
  const nextCategory = CATEGORIES[(CATEGORIES.findIndex((c) => c.id === category.id) + 1) % CATEGORIES.length]
  const selected = visible.find((b) => b.id === selectedId)
  const fmt = (v: number) => formatPrice(v, category.pence)
  const milesLabel = `${radius} mile${radius === 1 ? '' : 's'}`
  const noun = visible.length === 1 ? category.plural.replace(/s$/, '') : category.plural
  const headline = !visible.length
    ? `No ${category.plural} within ${milesLabel} yet.`
    : visible.length < 3
      ? `${visible.length} ${noun} within ${milesLabel}. Prices from ${fmt(stats.low)}.`
      : `${visible.length} ${noun} within ${milesLabel}. Most charge ${fmt(stats.q1)}–${fmt(stats.q3)}.`

  // ----- interactions -----
  const selectFromMap = (id: string | null) => {
    setSelectedId(id)
    if (id) {
      const b = visible.find((x) => x.id === id)
      track('pin_clicked', { category: category.id, radius, source: 'map', business: b?.name, price: b?.price })
    }
  }
  const selectFromList = (id: string) => {
    setSelectedId(id)
    setFocusKey((k) => k + 1)
    if (isMobile) setSheetSnap(0)
    const b = visible.find((x) => x.id === id)
    track('pin_clicked', { category: category.id, radius, source: 'list', business: b?.name, price: b?.price })
  }
  const changeRadius = (r: Radius) => {
    if (r === radius) return
    setRadius(r)
    writeUrl({ r })
    if (selected && selected.distance > r) setSelectedId(null)
    track('radius_changed', { category: category.id, radius: r })
  }
  const widen = () => changeRadius(radius === 1 ? 3 : 5)
  const tryNextCategory = () => {
    if (!result) return
    setCategoryId(nextCategory.id)
    search(result.place.postcode, nextCategory.id)
  }
  const addPrice = (price: number) => {
    if (!result) return
    setYourPrices((p) => ({ ...p, [result.categoryId]: price }))
    track('price_added', { category: category.id, radius, price, percentile: percentRank(prices, price) })
  }
  const editPrice = () => {
    if (!result) return
    setYourPrices((p) => {
      const next = { ...p }
      delete next[result.categoryId]
      return next
    })
  }

  // ----- shared pieces -----
  const radiusChips = (
    <div role="group" aria-label="Search radius" className="flex gap-1.5">
      {RADII.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={radius === r}
          onClick={() => changeRadius(r)}
          className={`h-10 rounded-full border px-4 text-sm font-bold shadow-sm transition ${
            radius === r ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
          }`}
        >
          {r} mile{r === 1 ? '' : 's'}
        </button>
      ))}
    </div>
  )

  const freshness = (
    <InfoTip question="How fresh is this?" align="right">
      We re-check every business at least every two weeks. Each listing shows exactly when we last looked.
    </InfoTip>
  )

  const leftColumn = result && (
    <>
      <ResultsSummary stats={stats} category={category} yourPrice={yourPrice} compact={isMobile} />
      {visible.length > 0 && (
        <YourPriceCard
          key={result.categoryId}
          category={category}
          stats={stats}
          prices={prices}
          yourPrice={yourPrice}
          onSubmit={addPrice}
          onEdit={editPrice}
        />
      )}
      {yourPrice !== null && <UpsellCard key={`upsell-${result.categoryId}`} category={category} radius={radius} />}
    </>
  )

  const list = result && (
    <BusinessList
      businesses={visible}
      category={category}
      median={stats.median}
      sort={sort}
      onSortChange={setSort}
      selectedId={selectedId}
      onSelect={selectFromList}
      radius={radius}
      onWiden={widen}
      nextCategory={nextCategory}
      onTryCategory={tryNextCategory}
      scrollable={!isMobile}
    />
  )

  const map = (padBottom: number, className: string, cardClass: string) =>
    result && (
      <PriceMap
        center={result.place}
        radius={radius}
        businesses={visible}
        median={stats.median}
        category={category}
        selectedId={selectedId}
        onSelect={selectFromMap}
        focusKey={focusKey}
        yourPrice={yourPrice}
        searchId={result.id}
        padBottom={padBottom}
        className={className}
        overlay={
          <>
            <div className="absolute top-3 left-3 z-[1000]">{radiusChips}</div>
            {selected && (
              <BusinessCard
                key={selected.id}
                business={selected}
                category={category}
                median={stats.median}
                onClose={() => setSelectedId(null)}
                className={cardClass}
              />
            )}
          </>
        }
      />
    )

  const header = (
    <header className="relative z-[1150] flex items-center gap-3 bg-white px-4 py-3 md:px-6 md:py-4">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          goHome()
        }}
        className="flex shrink-0 items-center gap-2"
        aria-label="Rivl home"
      >
        <span className="flex size-[30px] items-center justify-center rounded-[10px] bg-signal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.4" />
          </svg>
        </span>
        <span className={`text-[22px] font-extrabold tracking-[-0.03em] ${phase !== 'landing' && isMobile ? 'sr-only' : ''}`}>rivl</span>
      </a>
      {phase !== 'landing' && (
        <div className="flex min-w-0 flex-1 flex-col md:ml-6 md:max-w-xl">
          <SearchBar
            variant="compact"
            postcode={postcode}
            category={categoryId}
            onPostcodeChange={setPostcode}
            onCategoryChange={setCategoryId}
            onSubmit={submit}
            busy={searching}
            error={error}
          />
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-rust">
              {error}{' '}
              <button type="button" onClick={useExample} className="font-bold text-ink underline">Try {EXAMPLE_POSTCODE}</button>
            </p>
          )}
        </div>
      )}
    </header>
  )

  // ---------- LANDING ----------
  if (phase === 'landing') {
    return (
      <div className="flex min-h-dvh flex-col">
        {header}
        <main className="animate-fade-up mx-auto flex w-full max-w-[880px] flex-1 flex-col justify-center px-4 pt-10 pb-24 text-center sm:px-6 sm:pt-16">
          <h1 className="text-[clamp(40px,8vw,76px)] leading-[1.02] font-extrabold tracking-[-0.045em]">
            What's the going rate near you?
          </h1>
          <p className="mx-auto mt-5 mb-10 max-w-[560px] text-lg leading-relaxed text-ink-soft sm:text-xl">
            See what businesses like yours charge nearby, on one map, in seconds.
          </p>
          <SearchBar
            variant="hero"
            postcode={postcode}
            category={categoryId}
            onPostcodeChange={(v) => {
              setPostcode(v)
              setError(null)
            }}
            onCategoryChange={setCategoryId}
            onSubmit={submit}
            error={error}
            onUseExample={useExample}
          />
          <p className="mt-5 flex items-center justify-center gap-2 text-[15px] text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E8A5A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Free. No sign-up to search.
          </p>
        </main>
        <footer className="pb-6 text-center text-xs text-muted">
          Prototype with fictional businesses · press <kbd className="rounded border border-line px-1 font-mono">d</kbd> for the funnel log
        </footer>
        <DebugPanel />
      </div>
    )
  }

  // ---------- MOBILE: map on top, list in a bottom sheet ----------
  if (isMobile) {
    const peek = typeof window !== 'undefined' ? window.innerHeight * SHEET_SNAPS[0] : 200
    return (
      <div className="fixed inset-0 flex flex-col bg-white">
        {header}
        {phase === 'loading' || !result ? (
          <ResultsSkeleton mobile />
        ) : (
          <>
            {map(peek, 'flex-1', 'absolute top-16 left-3')}
            <BottomSheet
              snap={sheetSnap}
              onSnapChange={setSheetSnap}
              header={
                <div>
                  <h1 className="text-xl leading-snug font-extrabold tracking-tight">{headline}</h1>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[13px] text-muted">
                    <span className="truncate">Around {result.place.postcode} · {category.unit}</span>
                    {freshness}
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                {leftColumn}
                {list}
              </div>
            </BottomSheet>
          </>
        )}
        <DebugPanel />
      </div>
    )
  }

  // ---------- DESKTOP / TABLET ----------
  return (
    <div className="min-h-dvh">
      {header}
      {phase === 'loading' || !result ? (
        <ResultsSkeleton mobile={false} />
      ) : (
        <main key={result.id} className="animate-fade-up mx-auto max-w-[1400px] px-6 pb-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h1 className="text-[clamp(24px,3vw,34px)] leading-tight font-extrabold tracking-[-0.03em]">{headline}</h1>
              <p className="mt-1 text-[15px] text-muted">
                Around {result.place.postcode}
                {result.place.area ? `, ${result.place.area}` : ''} · comparing {category.unit} prices
              </p>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-muted">
              Prices checked in the last 9 days {freshness}
            </div>
          </div>
          <div className="grid items-start gap-5 md:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_340px]">
            <div className="space-y-4 md:row-span-2 xl:row-span-1">{leftColumn}</div>
            {map(0, 'h-[min(640px,calc(100dvh-170px))] min-h-[420px] rounded-2xl shadow-soft md:sticky md:top-4 md:col-start-2', 'absolute bottom-3 left-3')}
            <div className="md:col-start-2 xl:sticky xl:top-4 xl:col-start-3 xl:row-start-1 xl:flex xl:h-[min(640px,calc(100dvh-170px))] xl:min-h-[420px] xl:flex-col">
              {list}
            </div>
          </div>
        </main>
      )}
      <DebugPanel />
    </div>
  )
}
