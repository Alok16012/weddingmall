import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Check, Heart, MapPin, MessageCircle, Phone } from 'lucide-react'
import { repositories } from '@/repositories'
import { formatINR, formatDistanceKm, relativeTime } from '@/lib/format'
import { Stars } from '@/components/ui/Stars'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { useFavourites } from '@/hooks/useFavourites'

export default function ListingDetail() {
  const { id = '' } = useParams()
  const { isFavourite, toggle } = useFavourites()

  const { data: listing, isLoading, isError, refetch } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => repositories.listings.getById(id),
  })
  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => repositories.listings.reviewsFor(id),
    enabled: !!listing,
  })

  if (isLoading) {
    return (
      <div>
        <ScreenHeader title="" back />
        <Skeleton className="h-64 w-full rounded-none" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }
  if (isError || !listing) {
    return (
      <div>
        <ScreenHeader title="Vendor" back />
        <ErrorState onRetry={() => refetch()} message="This listing could not be found." />
      </div>
    )
  }

  const fav = isFavourite(listing.id)

  return (
    <div className="pb-28">
      <ScreenHeader
        title=""
        back
        right={
          <button
            onClick={() => toggle(listing.id)}
            aria-pressed={fav}
            aria-label={fav ? 'Remove from shortlist' : 'Add to shortlist'}
            className="tap grid h-10 w-10 place-items-center rounded-full border border-line bg-surface"
          >
            <Heart className={fav ? 'h-5 w-5 fill-coral text-coral' : 'h-5 w-5 text-ink-soft'} aria-hidden />
          </button>
        }
      />

      {/* Gallery */}
      <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4">
        {[listing.coverImage, ...listing.gallery].map((m) => (
          <img
            key={m.id}
            src={m.url}
            alt={m.alt}
            className="h-60 w-[85%] shrink-0 snap-center rounded-[var(--radius-card)] object-cover"
          />
        ))}
      </div>

      <div className="space-y-6 px-4 pt-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-ink">{listing.title}</h1>
            {listing.verified && (
              <Badge tone="success">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden /> {listing.city} · {formatDistanceKm(listing.distanceKm)}
            </span>
            <Stars rating={listing.rating} count={listing.reviewCount} />
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-ink-soft">{listing.description}</p>

        {/* Price */}
        <div className="rounded-[var(--radius-card)] bg-surface-2 p-4">
          <p className="text-sm text-muted">Starting price</p>
          <p className="tnum text-2xl font-semibold text-ink">
            {listing.fromPrice
              ? formatINR(listing.fromPrice.minorUnits)
              : 'Price on Request'}
            {listing.fromPrice?.unit && (
              <span className="ml-1 text-sm font-normal text-muted">{listing.fromPrice.unit}</span>
            )}
          </p>
        </div>

        {/* Amenities */}
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Amenities</h2>
          <ul className="grid grid-cols-2 gap-2">
            {listing.amenities.map((a) => (
              <li key={a} className="flex items-center gap-2 text-sm text-ink-soft">
                <Check className="h-4 w-4 text-success" aria-hidden /> {a}
              </li>
            ))}
          </ul>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Reviews</h2>
          {(reviews?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">No reviews yet — be the first after your booking.</p>
          ) : (
            <div className="space-y-3">
              {reviews?.map((r) => (
                <div key={r.id} className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{r.author}</span>
                    {r.verified && <Badge tone="success">Verified booking</Badge>}
                  </div>
                  <Stars rating={r.rating} className="mt-1" />
                  <p className="mt-2 text-sm text-ink-soft">{r.body}</p>
                  <p className="mt-1 text-xs text-muted">{relativeTime(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-3 border-t border-line bg-surface/95 p-3 backdrop-blur">
        <a href="tel:+910000000000" className={buttonClasses({ variant: 'outline', className: 'flex-1 text-coral' })}>
          <Phone className="h-4 w-4" /> Call
        </a>
        <Link to={`/enquiry/${listing.id}`} className={buttonClasses({ className: 'flex-[2]' })}>
          <MessageCircle className="h-4 w-4" /> Send Enquiry
        </Link>
      </div>
    </div>
  )
}
