import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORY_LABELS, categoryLabel } from '@/types/domain'
import { listVendors, type VendorSort } from '@/services/vendors'
import { listPopularCities } from '@/services/content'
import { useDebounced } from '@/hooks/useDebounced'
import { cn } from '@/lib/cn'
import { VendorCard } from '@/components/VendorCard'
import { EmptyState, ErrorState, VendorCardSkeleton } from '@/components/ui/states'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

const SORTS: { key: VendorSort; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'rating', label: 'Top rated' },
  { key: 'newest', label: 'Newest' },
  { key: 'name', label: 'A–Z' },
]

const PAGE_SIZE = 12

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? undefined
  const city = params.get('city') ?? undefined
  const trendingOnly = params.get('trending') === '1'

  const [rawQuery, setRawQuery] = useState(params.get('q') ?? '')
  const q = useDebounced(rawQuery, 350)
  const [sort, setSort] = useState<VendorSort>('recommended')
  const [showFilters, setShowFilters] = useState(false)

  const cities = useQuery({ queryKey: ['popular-cities'], queryFn: listPopularCities })

  const filters = useMemo(
    () => ({ q: q || undefined, category, city, trendingOnly, sort, pageSize: PAGE_SIZE }),
    [q, category, city, trendingOnly, sort],
  )

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['vendors', 'search', filters],
      queryFn: ({ pageParam = 0 }) => listVendors({ ...filters, page: pageParam as number }),
      initialPageParam: 0,
      getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    })

  const items = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? 0
  const activeCount = (category ? 1 : 0) + (city ? 1 : 0) + (trendingOnly ? 1 : 0)

  // Keep the URL in sync so results are deep-link/shareable.
  useEffect(() => {
    const p = new URLSearchParams(params)
    if (q) p.set('q', q)
    else p.delete('q')
    setParams(p, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function patch(key: string, value?: string) {
    const p = new URLSearchParams(params)
    if (value) p.set(key, value)
    else p.delete(key)
    setParams(p, { replace: true })
  }

  function clearAll() {
    setRawQuery('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const title = category ? categoryLabel(category) : 'All Vendors'

  return (
    <div>
      <ScreenHeader title={title} subtitle={city ?? undefined} />

      <div className="space-y-3 px-4">
        {/* Search */}
        <label className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search by name or description"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            aria-label="Search vendors"
          />
          {rawQuery && (
            <button onClick={() => setRawQuery('')} aria-label="Clear search">
              <X className="h-4 w-4 text-muted" />
            </button>
          )}
        </label>

        {/* Filter chips */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'tap inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-field)] border px-3.5 py-2 text-sm font-semibold',
              activeCount
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]'
                : 'border-line bg-surface text-ink',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
            {activeCount > 0 && <span className="tnum">({activeCount})</span>}
          </button>

          {category && (
            <Chip onClear={() => patch('category')}>{categoryLabel(category)}</Chip>
          )}
          {city && <Chip onClear={() => patch('city')}>{city}</Chip>}
          {trendingOnly && <Chip onClear={() => patch('trending')}>Trending</Chip>}

          <label className="tap ml-auto inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-2 text-sm">
            <span className="text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as VendorSort)}
              className="bg-transparent font-semibold text-[var(--color-primary)] outline-none"
              aria-label="Sort results"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
          </label>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="anim-panel-in space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div>
              <p className="mb-2 text-sm font-bold text-ink">Category</p>
              <div className="flex flex-wrap gap-2">
                <Pill active={!category} onClick={() => patch('category')}>All</Pill>
                {Object.keys(CATEGORY_LABELS).map((slug) => (
                  <Pill key={slug} active={category === slug} onClick={() => patch('category', slug)}>
                    {categoryLabel(slug)}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-ink">City</p>
              <div className="flex flex-wrap gap-2">
                <Pill active={!city} onClick={() => patch('city')}>All India</Pill>
                {cities.data?.map((c) => (
                  <Pill key={c.id} active={city === c.name} onClick={() => patch('city', c.name)}>
                    {c.name}
                  </Pill>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={trendingOnly}
                onChange={(e) => patch('trending', e.target.checked ? '1' : undefined)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Trending vendors only
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
              <Button size="sm" onClick={() => setShowFilters(false)}>Show {total} results</Button>
            </div>
          </div>
        )}

        <p className="tnum text-sm text-muted">
          {isLoading ? 'Searching…' : `${total} vendor${total === 1 ? '' : 's'} found`}
        </p>
      </div>

      {/* Results */}
      <div className="space-y-4 px-4 pt-1">
        {isLoading && [0, 1, 2].map((i) => <VendorCardSkeleton key={i} />)}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            icon={<MapPin className="h-7 w-7" />}
            title="No vendors match"
            description="Try a different city, category, or clear your filters."
            action={
              <Button size="sm" variant="outline" onClick={clearAll}>
                Clear all filters
              </Button>
            }
          />
        )}
        {items.map((v, i) => (
          <VendorCard key={v.id} vendor={v} index={i < PAGE_SIZE ? i : undefined} />
        ))}

        {hasNextPage && (
          <Button
            fullWidth
            variant="outline"
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        )}
      </div>
    </div>
  )
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-field)] border border-[var(--color-primary)] bg-[var(--color-primary-100)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
      {children}
      <button onClick={onClear} aria-label="Remove filter">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-field)] border px-3 py-1.5 text-sm font-medium',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]'
          : 'border-line bg-surface text-ink-soft',
      )}
    >
      {children}
    </button>
  )
}
