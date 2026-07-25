import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, ChevronRight, Crown, Heart, MapPin, Search } from 'lucide-react'
import { CATEGORY_LABELS, type VendorCategory } from '@/types/domain'
import { repositories } from '@/repositories'
import { useSession } from '@/auth/SessionContext'
import { formatINR } from '@/lib/format'
import { Logo } from '@/components/Brand'
import { Stars } from '@/components/ui/Stars'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { VendorCardSkeleton } from '@/components/ui/states'
import { TrustStrip, WhyWeddingMall } from '@/components/Trust'
import { useFavourites } from '@/hooks/useFavourites'

const heroImg =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=88'

const categoryImg: Record<VendorCategory, string> = {
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=300&q=80',
  makeup: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80',
  photography: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80',
  decor: 'https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=300&q=80',
  mehendi: 'https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?auto=format&fit=crop&w=300&q=80',
}

export default function Home() {
  const { user } = useSession()
  const { toggle, isFavourite } = useFavourites()

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', { sort: 'recommended' }],
    queryFn: () => repositories.listings.list({ sort: 'recommended' }),
  })
  const { data: milestones } = useQuery({
    queryKey: ['planner'],
    queryFn: () => repositories.planner.milestones(),
  })

  const done = (milestones ?? []).filter((m) => m.done).length
  const total = milestones?.length ?? 6
  const pct = total ? Math.round((done / total) * 100) : 0
  const nearby = (listings ?? []).slice(0, 6)

  return (
    <div>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-canvas/90 px-4 py-3 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            to="/explore"
            className="tap flex items-center gap-1 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-2 text-sm font-medium"
          >
            <MapPin className="h-4 w-4 text-coral" aria-hidden />
            {user?.city ?? 'Patna'}
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
          </Link>
          <Link
            to="/bookings"
            aria-label="Notifications"
            className="tap relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface"
          >
            <Bell className="h-5 w-5 text-ink" aria-hidden />
            <span className="tnum absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
              3
            </span>
          </Link>
        </div>
      </header>

      <div className="space-y-7 px-4">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[var(--radius-hero)] text-white shadow-[var(--shadow-float)]">
          <img src={heroImg} alt="Decorated wedding mandap with floral drapes" className="h-72 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
            <Badge tone="coral" className="bg-white/90">
              <Crown className="h-3.5 w-3.5" aria-hidden /> India&apos;s #1 Wedding Marketplace
            </Badge>
            <h1 className="max-w-[15ch] text-4xl font-semibold leading-[1.05]">Plan Your Dream Wedding</h1>
            <p className="text-sm text-white/85">Venues, vendors &amp; everything you need</p>
            <Link to="/explore" className={buttonClasses({ className: 'mt-1' })}>
              Start Planning <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Search */}
        <Link
          to="/explore"
          className="-mt-12 relative z-10 flex items-center gap-3 rounded-[var(--radius-pill)] bg-surface px-5 py-4 text-muted shadow-[var(--shadow-float)]"
        >
          <Search className="h-5 w-5" aria-hidden />
          Search venues, vendors, packages
        </Link>

        {/* Trust signals */}
        <TrustStrip />

        {/* Categories */}
        <section>
          <SectionHeader title="Explore Categories" to="/explore" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pt-3">
            {(Object.keys(CATEGORY_LABELS) as VendorCategory[]).map((cat, i) => (
              <Link
                key={cat}
                to={`/explore?category=${cat}`}
                style={{ '--i': i } as React.CSSProperties}
                className="reveal card-interactive w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]"
              >
                <img src={categoryImg[cat]} alt="" className="h-20 w-full object-cover" />
                <div className="px-2 py-2 text-center text-sm font-semibold text-ink">
                  {CATEGORY_LABELS[cat]}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Wedding journey */}
        <section className="rounded-[var(--radius-card)] bg-coral-100/70 p-4">
          <div className="flex items-center gap-4">
            <div
              className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-coral) ${pct}%, #ffffff 0)`,
              }}
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-surface">
                <Heart className="h-5 w-5 text-coral" aria-hidden />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-ink">Your Wedding Journey</h3>
              <p className="tnum text-sm text-coral-600">
                {done} of {total} completed
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <Link to="/planner" className={buttonClasses({ size: 'sm', fullWidth: true, className: 'mt-3' })}>
            Continue Planning <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Popular near you */}
        <section className="pb-2">
          <SectionHeader title={`Popular Near ${user?.city ?? 'Patna'}`} to="/explore" />
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pt-3">
            {isLoading &&
              [0, 1].map((i) => (
                <div key={i} className="w-64 shrink-0">
                  <VendorCardSkeleton />
                </div>
              ))}
            {nearby.map((l, i) => (
              <div
                key={l.id}
                style={{ '--i': i } as React.CSSProperties}
                className="reveal card-interactive w-64 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]"
              >
                <Link to={`/listing/${l.id}`} className="relative block">
                  <img src={l.coverImage.url} alt={l.coverImage.alt} loading="lazy" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggle(l.id)
                    }}
                    aria-pressed={isFavourite(l.id)}
                    aria-label={isFavourite(l.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                    className="tap absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90"
                  >
                    <Heart className={isFavourite(l.id) ? 'h-5 w-5 fill-coral text-coral' : 'h-5 w-5 text-ink-soft'} aria-hidden />
                  </button>
                  <span className="absolute bottom-2 left-2 rounded-[var(--radius-pill)] bg-ink/80 px-2 py-1 text-xs font-semibold text-white">
                    <Stars rating={l.rating} count={l.reviewCount} className="text-white [&_span]:text-white" />
                  </span>
                </Link>
                <div className="p-3">
                  <h3 className="truncate text-base font-semibold text-ink">{l.title}</h3>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {l.city}
                  </p>
                  <p className="mt-1 text-sm font-bold text-coral">
                    {l.fromPrice ? `Starting ${formatINR(l.fromPrice.minorUnits, { compact: true })}` : 'Price on Request'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust / safety */}
        <div className="pb-4">
          <WhyWeddingMall />
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <Link to={to} className="flex items-center gap-0.5 text-sm font-semibold text-coral">
        View all <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
