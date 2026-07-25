import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, Heart, MapPin, Search, SlidersHorizontal, Star, Users } from 'lucide-react'
import { CATEGORY_LABELS, type VendorCategory } from '@/types/domain'
import { repositories } from '@/repositories'
import type { ListingQuery } from '@/repositories/types'
import { cn } from '@/lib/cn'
import { VendorCard } from '@/components/VendorCard'
import { EmptyState, ErrorState, VendorCardSkeleton } from '@/components/ui/states'

type SortKey = NonNullable<ListingQuery['sort']>
const SORT_LABELS: Record<SortKey, string> = {
  recommended: 'Popular',
  rating: 'Top rated',
  distance: 'Nearest',
  price_low: 'Price: low',
}

const FILTER_CHIPS: { key: string; label: string; icon: typeof Star }[] = [
  { key: 'budget', label: 'Budget', icon: SlidersHorizontal },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'rating', label: 'Rating', icon: Star },
  { key: 'capacity', label: 'Capacity', icon: Users },
]

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') as VendorCategory | null) ?? undefined
  const [q, setQ] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('recommended')
  const [showFilters, setShowFilters] = useState(false)

  const query: ListingQuery = useMemo(
    () => ({ q: q.trim() || undefined, category, verifiedOnly, sort }),
    [q, category, verifiedOnly, sort],
  )

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['listings', query],
    queryFn: () => repositories.listings.list(query),
  })

  const heading = category ? CATEGORY_LABELS[category] : 'Wedding Vendors'
  const activeFilters = (verifiedOnly ? 1 : 0) + (category ? 1 : 0)

  function setCategory(next?: VendorCategory) {
    const p = new URLSearchParams(params)
    if (next) p.set('category', next)
    else p.delete('category')
    setParams(p, { replace: true })
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-canvas/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">{heading}</h1>
          <div className="flex items-center gap-2">
            <button aria-label="Shortlist" className="tap grid h-10 w-10 place-items-center rounded-full border border-line bg-surface">
              <Heart className="h-5 w-5" aria-hidden />
            </button>
            <button aria-label="Notifications" className="tap relative grid h-10 w-10 place-items-center rounded-full border border-line bg-surface">
              <Bell className="h-5 w-5" aria-hidden />
              <span className="tnum absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">2</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <label className="mt-3 flex items-center gap-3 rounded-[var(--radius-pill)] border border-line bg-surface px-4 py-3">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venues or cities"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            aria-label="Search venues or cities"
          />
        </label>

        {/* Filter chips */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'tap inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border px-3.5 py-2 text-sm font-semibold',
              activeFilters ? 'border-coral bg-coral-100 text-coral-600' : 'border-line bg-surface text-ink',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
            {activeFilters > 0 && <span className="tnum">({activeFilters})</span>}
          </button>
          {FILTER_CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setShowFilters(true)}
              className="tap inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink"
            >
              <c.icon className="h-4 w-4 text-muted" aria-hidden /> {c.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <p className="mb-2 text-sm font-semibold text-ink">Category</p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={!category} onClick={() => setCategory(undefined)}>All</FilterPill>
              {(Object.keys(CATEGORY_LABELS) as VendorCategory[]).map((cat) => (
                <FilterPill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                  {CATEGORY_LABELS[cat]}
                </FilterPill>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--color-coral)]" />
              Verified vendors only
            </label>
          </div>
        )}
      </header>

      {/* Result meta */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="tnum text-sm text-muted">
          {isLoading ? 'Searching…' : `${data?.length ?? 0} ${heading.toLowerCase()} found`}
        </p>
        <label className="flex items-center gap-1 text-sm">
          <span className="text-muted">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent font-semibold text-coral outline-none"
            aria-label="Sort results"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Results */}
      <div className="space-y-4 px-4" aria-busy={isFetching}>
        {isLoading && [0, 1, 2].map((i) => <VendorCardSkeleton key={i} />)}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState
            title="No vendors match"
            description="Try clearing filters or searching a different category."
            action={
              <button
                onClick={() => {
                  setQ('')
                  setVerifiedOnly(false)
                  setCategory(undefined)
                }}
                className="text-sm font-semibold text-coral"
              >
                Clear all filters
              </button>
            }
          />
        )}
        {!isLoading && !isError && data?.map((l, i) => <VendorCard key={l.id} listing={l} index={i} />)}
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium',
        active ? 'border-coral bg-coral-100 text-coral-600' : 'border-line bg-surface text-ink-soft',
      )}
    >
      {children}
    </button>
  )
}
