import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, Globe2, MapPin, Search } from 'lucide-react'
import { listLocations, listPopularCities } from '@/services/content'
import { useCity } from '@/hooks/useCity'
import { cn } from '@/lib/cn'
import { Skeleton, ErrorState } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function CitySelector() {
  const navigate = useNavigate()
  const { city, setCity } = useCity()
  const [q, setQ] = useState('')
  const [openState, setOpenState] = useState<string | null>(null)

  const popular = useQuery({ queryKey: ['popular-cities'], queryFn: listPopularCities })
  const all = useQuery({ queryKey: ['locations'], queryFn: listLocations })

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const rows = (all.data ?? []).filter((l) =>
      needle ? `${l.city} ${l.state}`.toLowerCase().includes(needle) : true,
    )
    return rows.reduce<Record<string, string[]>>((acc, r) => {
      ;(acc[r.state] ??= []).push(r.city)
      return acc
    }, {})
  }, [all.data, q])

  const searching = q.trim() !== ''

  function choose(next: string | null) {
    setCity(next)
    navigate(-1)
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Select City" back />
      <div className="px-4">
        <label className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search city or state"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            aria-label="Search city"
          />
        </label>

        <button
          onClick={() => choose(null)}
          className={cn(
            'tap mt-3 flex w-full items-center gap-3 rounded-[var(--radius-field)] border px-4 py-3 text-left',
            !city ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)]' : 'border-line bg-surface',
          )}
        >
          <Globe2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <span className="flex-1 font-semibold text-ink">All India</span>
          {!city && <Check className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />}
        </button>

        {!q && (
          <section className="mt-5">
            <h2 className="mb-2 text-lg text-ink">Popular Cities</h2>
            {popular.isLoading && <Skeleton className="h-10 w-full" />}
            <div className="flex flex-wrap gap-2">
              {popular.data?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => choose(c.name)}
                  className={cn(
                    'tap rounded-[var(--radius-field)] border px-3.5 py-2 text-sm font-semibold',
                    city === c.name
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]'
                      : 'border-line bg-surface text-ink',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Every state and union territory. Collapsed by default — the full list
            runs to ~1,000 cities, and rendering all of them at once made this
            screen janky to scroll on a mid-range phone. Searching expands the
            matches instead, which is how anyone finds a city anyway. */}
        <section className="mt-5">
          <h2 className="mb-2 text-lg text-ink">
            {searching ? 'Search Results' : 'All Locations'}
          </h2>
          {all.isLoading && <Skeleton className="h-40 w-full" />}
          {all.isError && <ErrorState onRetry={() => all.refetch()} />}
          {!all.isLoading && searching && Object.keys(grouped).length === 0 && (
            <p className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
              No city matches “{q.trim()}”.
            </p>
          )}
          <div className="space-y-2">
            {Object.entries(grouped).map(([state, cities]) => {
              const open = searching || openState === state
              return (
                <div
                  key={state}
                  className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
                >
                  <button
                    onClick={() => setOpenState(open && !searching ? null : state)}
                    aria-expanded={open}
                    className="tap flex w-full items-center gap-2 px-4 py-3 text-left"
                  >
                    <span className="flex-1 text-[15px] font-semibold text-ink">{state}</span>
                    <span className="tnum text-xs text-muted">{cities.length}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <div className="divide-y divide-line border-t border-line">
                      {cities.map((c) => (
                        <button
                          key={c}
                          onClick={() => choose(c)}
                          className="tap flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-surface-2"
                        >
                          <MapPin className="h-4 w-4 text-muted" aria-hidden />
                          <span className="flex-1 text-ink">{c}</span>
                          {city === c && (
                            <Check className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
