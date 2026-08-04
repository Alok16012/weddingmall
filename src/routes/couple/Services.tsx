import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, MapPin, Store } from 'lucide-react'
import { CATEGORY_GROUPS, categoryLabel } from '@/types/domain'
import { categoryDirectory } from '@/services/vendors'
import { useCity } from '@/hooks/useCity'
import { Img } from '@/components/ui/Img'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/**
 * Wedding Services directory — every category, not the eight Home has room for.
 *
 * This is what "View all" on the Home services row opens. It used to go to
 * /explore, which drops you straight into a flat list of vendors and hides the
 * other twelve service types entirely; the point of "view all" on a row of
 * categories is to see the rest of the categories.
 */
export default function Services() {
  const { city } = useCity()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['category-directory', city],
    queryFn: () => categoryDirectory(city ?? undefined),
    staleTime: 5 * 60_000,
  })

  return (
    <div className="pb-8">
      <ScreenHeader
        title="Wedding Services"
        subtitle={city ? `Showing availability in ${city}` : 'Across India'}
        back
        right={
          <Link
            to="/city"
            className="tap flex items-center gap-1 rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-1.5 text-[13px] font-semibold text-ink"
          >
            <MapPin className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
            <span className="max-w-[7rem] truncate">{city ?? 'All India'}</span>
          </Link>
        }
      />

      {isError && (
        <div className="px-4 pt-6">
          <ErrorState onRetry={() => refetch()} />
        </div>
      )}

      <div className="space-y-6 px-4 pt-4">
        {CATEGORY_GROUPS.map((group) => {
          // Once counts are in, a category with nothing behind it is a dead end,
          // so it drops out — and with it any group that empties completely.
          const slugs = data ? group.slugs.filter((s) => (data[s]?.count ?? 0) > 0) : group.slugs
          if (slugs.length === 0) return null

          return (
            <section key={group.title}>
              <h2 className="text-[1.05rem] font-bold text-ink">{group.title}</h2>
              <ul className="mt-2 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                {slugs.map((slug) => (
                  <li key={slug}>
                    <Link
                      to={`/explore?category=${slug}${city ? `&city=${encodeURIComponent(city)}` : ''}`}
                      className="tap flex items-center gap-3 p-3"
                    >
                      <Img
                        src={data?.[slug]?.image}
                        alt=""
                        width={48}
                        height={48}
                        rounded="rounded-full"
                        wrapperClassName="h-12 w-12 shrink-0 ring-1 ring-line"
                        fallback={<Store className="h-4 w-4" aria-hidden />}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-ink">
                          {categoryLabel(slug)}
                        </p>
                        {isLoading ? (
                          <Skeleton className="mt-1 h-3 w-16" />
                        ) : (
                          <p className="tnum text-xs text-muted">
                            {data?.[slug]?.count ?? 0} listed
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
