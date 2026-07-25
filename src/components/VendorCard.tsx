import { Link } from 'react-router-dom'
import { BadgeCheck, Car, Heart, MapPin, Users } from 'lucide-react'
import type { Listing } from '@/types/domain'
import { cn } from '@/lib/cn'
import { formatINR } from '@/lib/format'
import { Stars } from './ui/Stars'
import { buttonClasses } from './ui/Button'
import { useFavourites } from '@/hooks/useFavourites'

function capacityLabel(l: Listing): string | null {
  if (l.capacityMin && l.capacityMax) return `${l.capacityMin}–${l.capacityMax} Guests`
  if (l.capacityMax) return `Up to ${l.capacityMax} Guests`
  return null
}

/** Full results card — matches the Explore "Wedding Venues" reference design. */
export function VendorCard({ listing }: { listing: Listing }) {
  const { isFavourite, toggle } = useFavourites()
  const fav = isFavourite(listing.id)
  const cap = capacityLabel(listing)

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
      <Link to={`/listing/${listing.id}`} className="relative block">
        <img
          src={listing.coverImage.url}
          alt={listing.coverImage.alt}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
        {listing.verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-ink/85 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
            <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            VERIFIED
          </span>
        )}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-ink/70 px-2 py-1 text-[11px] font-semibold text-white">
          {listing.gallery.length}+
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            toggle(listing.id)
          }}
          aria-pressed={fav}
          aria-label={fav ? 'Remove from shortlist' : 'Add to shortlist'}
          className="tap absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-[var(--shadow-card)]"
        >
          <Heart className={cn('h-5 w-5 transition', fav ? 'fill-coral text-coral' : 'text-ink-soft')} aria-hidden />
        </button>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">
            <Link to={`/listing/${listing.id}`}>{listing.title}</Link>
          </h3>
          <span className="whitespace-nowrap pt-1 text-sm font-bold text-coral">
            {listing.priceMode === 'on_request' || !listing.fromPrice
              ? 'Price on Request'
              : `From ${formatINR(listing.fromPrice.minorUnits, { compact: true })}`}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-4 w-4" aria-hidden />
          {listing.city}
        </div>

        <div className="mt-2">
          <Stars rating={listing.rating} count={listing.reviewCount || undefined} />
          {!listing.reviewCount && <span className="ml-1 text-sm text-muted">No reviews yet</span>}
        </div>

        {(cap || listing.amenities[0]) && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {cap && (
              <div className="flex items-center gap-2 rounded-[var(--radius-field)] bg-surface-2 px-3 py-2 text-sm text-ink-soft">
                <Users className="h-4 w-4" aria-hidden /> {cap}
              </div>
            )}
            {listing.amenities.find((a) => /parking/i.test(a)) && (
              <div className="flex items-center gap-2 rounded-[var(--radius-field)] bg-surface-2 px-3 py-2 text-sm text-ink-soft">
                <Car className="h-4 w-4" aria-hidden />{' '}
                {listing.amenities.find((a) => /parking/i.test(a))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to={`/enquiry/${listing.id}`}
            className={buttonClasses({ variant: 'outline', className: 'text-coral' })}
          >
            Send Enquiry
          </Link>
          <Link to={`/listing/${listing.id}`} className={buttonClasses()}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
