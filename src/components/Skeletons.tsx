export function ResultsSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div aria-busy="true" aria-label="Loading prices" className="flex flex-1 flex-col">
        <div className="skeleton flex-1 rounded-none" />
        <div className="space-y-3 rounded-t-3xl bg-white p-5">
          <div className="skeleton h-7 w-3/4" />
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-16" />
        </div>
      </div>
    )
  }
  return (
    <div aria-busy="true" aria-label="Loading prices" className="mx-auto w-full max-w-[1400px] px-6 pb-12">
      <div className="skeleton mb-2 h-10 w-full max-w-lg" />
      <div className="skeleton mb-6 h-5 w-64" />
      <div className="grid gap-5 md:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr_340px]">
        <div className="space-y-4">
          <div className="skeleton h-[330px] rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
        <div className="skeleton h-[560px] rounded-2xl" />
        <div className="hidden space-y-2 xl:block">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="skeleton h-[70px]" />
          ))}
        </div>
      </div>
    </div>
  )
}
