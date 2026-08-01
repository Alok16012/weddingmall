import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, MapPin, Search, Sparkles, Tag } from 'lucide-react'
import { HOME_CATEGORIES } from '@/types/domain'
import { listVendors, listTrending } from '@/services/vendors'
import { listBlogs, listPopularCities } from '@/services/content'
import { useCity } from '@/hooks/useCity'
import { LogoMark } from '@/components/Brand'
import { VendorRow } from '@/components/VendorRow'
import { VendorCard } from '@/components/VendorCard'
import { VendorCardSkeleton, Skeleton, ErrorState } from '@/components/ui/states'
import { CategoryTile } from '@/components/CategoryTile'
import { TrustStrip, WhyWeddingMall } from '@/components/Trust'

export default function Home() {
  const { city } = useCity()

  const trending = useQuery({
    queryKey: ['vendors', 'trending', city],
    queryFn: () => listTrending(8),
  })
  const featured = useQuery({
    queryKey: ['vendors', 'featured', city],
    queryFn: () =>
      listVendors({ city: city ?? undefined, pageSize: 6, sort: 'recommended' }).then((p) => p.items),
  })
  const cities = useQuery({ queryKey: ['popular-cities'], queryFn: listPopularCities })
  const blogs = useQuery({ queryKey: ['blogs', 3], queryFn: () => listBlogs(3) })

  return (
    <div className="pb-4">
      {/* ---- Brand header block: the search widget floats over its lower edge ---- */}
      <div className="header-block relative px-4 pb-16 pt-3 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <LogoMark className="h-7 w-7 brightness-0 invert" />
            <span className="text-lg font-bold tracking-tight">WeddingMall</span>
          </span>
          <Link
            to="/city"
            className="tap flex items-center gap-1 rounded-[var(--radius-field)] bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {city ?? 'All India'}
            <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
          </Link>
        </div>

        <div className="mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> India&apos;s Wedding Marketplace
          </span>
          <h1 className="mt-2 text-[1.7rem] font-bold leading-tight">Plan Your Dream Wedding</h1>
          <p className="mt-0.5 text-sm text-white/90">Discover, compare &amp; book the best vendors</p>
        </div>
      </div>

      {/* Floating search widget — overlaps the header (Dimensional Layering) */}
      <div className="relative z-10 -mt-11 px-4">
        <Link
          to="/explore"
          className="elevate-3 flex items-center gap-3 rounded-[var(--radius-card)] bg-surface px-4 py-3.5 text-muted"
        >
          <Search className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <span className="text-[15px]">Search venues, vendors, cities</span>
        </Link>
      </div>

      <div className="mt-6 space-y-7">
        {/* Categories */}
        <section>
          <SectionHead title="Wedding Services" to="/explore" />
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-4 pt-3">
            {HOME_CATEGORIES.map((slug) => (
              <CategoryTile key={slug} slug={slug} city={city} />
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <div className="px-4">
          <TrustStrip />
        </div>

        {/* Trending — carousel of full cards */}
        <section>
          <SectionHead title="Trending Vendors" to="/explore?trending=1" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-3">
            {trending.isLoading &&
              [0, 1].map((i) => (
                <div key={i} className="w-[270px] shrink-0">
                  <VendorCardSkeleton />
                </div>
              ))}
            {trending.isError && (
              <div className="w-full">
                <ErrorState onRetry={() => trending.refetch()} />
              </div>
            )}
            {trending.data?.map((v) => (
              <div key={v.id} className="w-[270px] shrink-0">
                <VendorCard vendor={v} />
              </div>
            ))}
          </div>
        </section>

        {/* Browse by city */}
        <section>
          <SectionHead title="Browse by City" to="/city" />
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
            {cities.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-24 shrink-0" />)}
            {cities.data?.map((c) => (
              <Link
                key={c.id}
                to={`/explore?city=${encodeURIComponent(c.name)}`}
                className="elevate-2 tap flex shrink-0 items-center gap-1.5 rounded-[var(--radius-field)] bg-surface px-3.5 py-2 text-sm font-semibold text-ink"
              >
                <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden />
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Recommended — dense rows */}
        <section>
          <SectionHead title={city ? `Popular in ${city}` : 'Recommended for You'} to="/explore" />
          <div className="space-y-2.5 px-4 pt-3">
            {featured.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[124px] w-full" />)}
            {featured.isError && <ErrorState onRetry={() => featured.refetch()} />}
            {featured.data?.map((v, i) => (
              <VendorRow key={v.id} vendor={v} index={i} />
            ))}
          </div>
        </section>

        {/* Blogs */}
        {!!blogs.data?.length && (
          <section>
            <SectionHead title="Wedding Ideas & Tips" to="/blogs" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-3">
              {blogs.data.map((b) => (
                <Link
                  key={b.id}
                  to={`/blogs/${b.slug}`}
                  className="elevate-2 w-60 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface"
                >
                  {b.image && <img src={b.image} alt="" className="h-28 w-full object-cover" />}
                  <div className="p-3">
                    {b.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)]">
                        <Tag className="h-2.5 w-2.5" aria-hidden /> {b.category}
                      </span>
                    )}
                    <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-ink">
                      {b.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="pb-2">
          <WhyWeddingMall />
        </div>
      </div>
    </div>
  )
}

function SectionHead({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-[1.15rem] font-bold text-ink">{title}</h2>
      <Link to={to} className="flex items-center gap-0.5 text-[13px] font-bold text-[var(--color-primary)]">
        View all <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
