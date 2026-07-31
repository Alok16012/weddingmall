import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, MapPin, Search, Sparkles } from 'lucide-react'
import { HOME_CATEGORIES } from '@/types/domain'
import { listVendors, listTrending } from '@/services/vendors'
import { listBlogs, listPopularCities } from '@/services/content'
import { useCity } from '@/hooks/useCity'
import { Logo } from '@/components/Brand'
import { VendorCard } from '@/components/VendorCard'
import { VendorCardSkeleton, Skeleton, ErrorState } from '@/components/ui/states'
import { CategoryTile } from '@/components/CategoryTile'

const HERO =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=88'

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
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur">
        <Logo />
        <Link
          to="/city"
          className="tap flex items-center gap-1 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-2 text-sm font-medium"
        >
          <MapPin className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          {city ?? 'All India'}
          <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
        </Link>
      </header>

      <div className="space-y-7">
        {/* Hero + search */}
        <div className="relative px-4 pt-4">
          <section className="relative overflow-hidden rounded-[var(--radius-hero)] text-white">
            <img src={HERO} alt="" className="h-64 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#221f20]/92 via-[#221f20]/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 pb-12">
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-bold text-[#221f20]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> India&apos;s Wedding Marketplace
              </span>
              <h1 className="max-w-[16ch] text-[2.1rem] leading-[1.12]">Plan Your Dream Wedding</h1>
              <p className="text-sm text-white/90">
                Discover, compare &amp; book the best wedding vendors
              </p>
            </div>
          </section>

          <Link
            to="/explore"
            className="relative z-10 -mt-7 mx-2 flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3.5 text-muted shadow-[var(--shadow-float)]"
          >
            <Search className="h-5 w-5" aria-hidden />
            Search venues, vendors, cities
          </Link>
        </div>

        {/* Categories */}
        <Section title="Wedding Services" to="/explore">
          <div className="grid grid-cols-4 gap-3 px-4 pt-3">
            {HOME_CATEGORIES.map((slug) => (
              <CategoryTile key={slug} slug={slug} city={city} />
            ))}
          </div>
        </Section>

        {/* Trending */}
        <Section title="Trending Vendors" to="/explore?trending=1">
          <Rail>
            {trending.isLoading &&
              [0, 1].map((i) => (
                <div key={i} className="w-72 shrink-0">
                  <VendorCardSkeleton />
                </div>
              ))}
            {trending.isError && (
              <div className="w-full px-4">
                <ErrorState onRetry={() => trending.refetch()} />
              </div>
            )}
            {trending.data?.map((v) => (
              <div key={v.id} className="w-72 shrink-0">
                <VendorCard vendor={v} />
              </div>
            ))}
          </Rail>
        </Section>

        {/* Browse by city */}
        <Section title="Browse by City" to="/city">
          <Rail>
            {cities.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-28 shrink-0" />)}
            {cities.data?.map((c) => (
              <Link
                key={c.id}
                to={`/explore?city=${encodeURIComponent(c.name)}`}
                className="tap flex shrink-0 items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink"
              >
                <MapPin className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
                {c.name}
              </Link>
            ))}
          </Rail>
        </Section>

        {/* Featured / recommended */}
        <Section title={city ? `Popular in ${city}` : 'Recommended for You'} to="/explore">
          <div className="space-y-4 px-4 pt-3">
            {featured.isLoading && [0, 1].map((i) => <VendorCardSkeleton key={i} />)}
            {featured.isError && <ErrorState onRetry={() => featured.refetch()} />}
            {featured.data?.map((v, i) => (
              <VendorCard key={v.id} vendor={v} index={i} />
            ))}
          </div>
        </Section>

        {/* Blogs */}
        {!!blogs.data?.length && (
          <Section title="Wedding Ideas & Tips" to="/blogs">
            <Rail>
              {blogs.data.map((b) => (
                <Link
                  key={b.id}
                  to={`/blogs/${b.slug}`}
                  className="w-64 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
                >
                  {b.image && <img src={b.image} alt="" className="h-32 w-full object-cover" />}
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-ink">{b.title}</h3>
                    {b.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted">{b.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </Rail>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between px-4">
        <h2 className="text-[1.35rem] text-ink">{title}</h2>
        <Link to={to} className="flex items-center gap-0.5 text-sm font-semibold text-[var(--color-primary)]">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  )
}

function Rail({ children }: { children: React.ReactNode }) {
  return <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-3">{children}</div>
}
