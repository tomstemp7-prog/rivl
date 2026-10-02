import { CATEGORIES, type CategoryId } from '../mockData'
import { EXAMPLE_POSTCODE } from '../lib/postcode'

interface Props {
  variant: 'hero' | 'compact'
  postcode: string
  category: CategoryId
  onPostcodeChange: (v: string) => void
  onCategoryChange: (v: CategoryId) => void
  onSubmit: () => void
  busy?: boolean
  error?: string | null
  onUseExample?: () => void
}

export function SearchBar(props: Props) {
  const { variant, postcode, category, onPostcodeChange, onCategoryChange, onSubmit, busy, error, onUseExample } = props
  const hero = variant === 'hero'
  const errorId = `${variant}-search-error`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  if (!hero) {
    return (
      <form onSubmit={submit} className="flex w-full items-center gap-2" role="search">
        <label className="sr-only" htmlFor="pc-compact">Postcode</label>
        <input
          id="pc-compact"
          value={postcode}
          onChange={(e) => onPostcodeChange(e.target.value)}
          autoComplete="postal-code"
          aria-invalid={!!error}
          className="h-11 w-28 min-w-0 flex-1 rounded-xl border border-line px-3 text-[15px] font-semibold uppercase outline-none focus:border-ink sm:w-32 sm:flex-none"
        />
        <label className="sr-only" htmlFor="cat-compact">Business type</label>
        <select
          id="cat-compact"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as CategoryId)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-2.5 text-[15px] font-medium outline-none focus:border-ink sm:flex-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="h-11 shrink-0 rounded-xl bg-ink px-4 text-[15px] font-bold text-white transition hover:bg-black disabled:opacity-60"
        >
          {busy ? '…' : 'Update'}
        </button>
      </form>
    )
  }

  return (
    <div>
      <form
        onSubmit={submit}
        role="search"
        className="flex flex-col gap-2 rounded-[20px] border border-[#E1E6EB] bg-white p-2 text-left shadow-lift sm:flex-row"
      >
        <div className="flex flex-1 flex-col rounded-[14px] bg-mist px-4 py-2.5 focus-within:ring-2 focus-within:ring-ink">
          <label htmlFor="pc-hero" className="text-xs font-bold tracking-wider text-muted uppercase">Postcode</label>
          <input
            id="pc-hero"
            value={postcode}
            onChange={(e) => onPostcodeChange(e.target.value)}
            placeholder={`e.g. ${EXAMPLE_POSTCODE}`}
            autoComplete="postal-code"
            autoFocus
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="min-w-0 bg-transparent py-1 text-xl font-bold uppercase outline-none placeholder:font-semibold placeholder:normal-case placeholder:text-[#8A96A3]"
          />
        </div>
        <div className="flex flex-1 flex-col rounded-[14px] bg-mist px-4 py-2.5 focus-within:ring-2 focus-within:ring-ink">
          <label htmlFor="cat-hero" className="text-xs font-bold tracking-wider text-muted uppercase">Business type</label>
          <select
            id="cat-hero"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as CategoryId)}
            className="-ml-1 bg-transparent py-1 text-xl font-bold outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="min-h-16 rounded-[14px] bg-signal px-8 text-[19px] font-extrabold text-white shadow-[0_8px_20px_rgba(255,90,31,0.35)] transition hover:bg-signal-dark active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? 'Finding prices…' : 'Show prices'}
        </button>
      </form>
      {error && (
        <div
          id={errorId}
          role="alert"
          className="animate-fade-up mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl bg-peach px-4 py-3 text-[15px] text-rust"
        >
          <span>{error}</span>
          {onUseExample && (
            <button type="button" onClick={onUseExample} className="font-bold text-ink underline underline-offset-2">
              Try {EXAMPLE_POSTCODE}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
