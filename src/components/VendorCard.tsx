import { Link } from 'react-router-dom'
import { BadgeCheck, Heart, Images, MapPin, Star, Users } from 'lucide-react'
import type { Vendor } from '@/types/domain'
import { cn } from '@/lib/cn'
import { buttonClasses } from './ui/Button'
import { useFavourites } from '@/hooks/useFavourites'
import { Img } from './ui/Img'

/** Plate pricing is the real, populated price signal on this backend. */
export function platePrice(v: Vendor): string | null {
  const veg = v.vegPrice?.replace(/\/-$/, '').trim()
  const nonVeg = v.nonVegPrice?.replace(/\/-$/, '').trim()
  if (veg && nonVeg) return `₹${veg} veg · ₹${nonVeg} non-veg`
  if (veg) return `₹${veg} per plate (veg)`
  if (nonVeg) return `₹${nonVeg} per plate`
  if (v.price) return `₹${v.price}${v.priceUnit ? ` ${v.priceUnit}` : ''}`
  return null
}

const BADGE_TONE: Record<string, string> = {
  'Most Preferred': 'bg-[var(--color-primary)] text-white',
  Preferred: 'bg-[var(--color-accent)] text-[var(--color-text)]',
  'Budget Venue': 'bg-success-100 text-success',
  Promotional: 'bg-[var(--color-primary-100)] text-[var(--color-primary)]',
}

export function VendorCard({ vendor, index }: { vendor: Vendor; index?: number }) {
  const { isFavourite, toggle } = useFavourites()
  const fav = isFavourite(vendor.id)
  const price = platePrice(vendor)
  const seating = vendor.amenities.seatingCapacity
  const parking = vendor.amenities.parkingCapacity

  return (
    <article
      style={index !== undefined ? ({ '--i': index } as React.CSSProperties) : undefined}
      className={cn(
        'pressable elevate-2 overflow-hidden rounded-[var(--radius-card)] bg-surface',
        index !== undefined && 'reveal',
      )}
    >
      <Link to={`/vendor/${vendor.id}`} className="relative block">
        <Img
          src={vendor.image}
          alt={vendor.name}
          width={280}
          height={176}
          rounded="rounded-none"
          wrapperClassName="h-44 w-full"
          fallback={<Images className="h-8 w-8" aria-hidden />}
        />

        {vendor.badge && (
          <span
            className={cn(
              'absolute left-3 top-3 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-semibold',
              BADGE_TONE[vendor.badge] ?? 'bg-ink/85 text-white',
            )}
          >
            {vendor.badge}
          </span>
        )}

        {vendor.images.length > 1 && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-ink/70 px-2 py-1 text-[11px] font-semibold text-white">
            <Images className="h-3.5 w-3.5" aria-hidden /> {vendor.images.length}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            toggle(vendor.id)
          }}
          aria-pressed={fav}
          aria-label={fav ? 'Remove from shortlist' : 'Add to shortlist'}
          className="tap absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-[var(--shadow-card)]"
        >
          <Heart
            className={cn('h-5 w-5 transition', fav ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-ink-soft')}
            aria-hidden
          />
        </button>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-bold leading-snug text-ink">
            <Link to={`/vendor/${vendor.id}`}>{vendor.name}</Link>
          </h3>
          {vendor.rating != null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-field)] bg-success px-1.5 py-0.5 text-xs font-bold text-white">
              <Star className="h-3 w-3 fill-white" aria-hidden />
              <span className="tnum">{vendor.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        {vendor.location && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-4 w-4" aria-hidden /> {vendor.location}
          </p>
        )}

        {(seating || parking) && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {seating && (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-field)] bg-surface-2 px-2.5 py-1.5 text-xs text-ink-soft">
                <Users className="h-3.5 w-3.5" aria-hidden /> {seating} guests
              </span>
            )}
            {vendor.amenities.bridalRoom && (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-field)] bg-surface-2 px-2.5 py-1.5 text-xs text-ink-soft">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Bridal room
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-2">
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {price ?? 'Price on Request'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Link
            to={`/enquiry/${vendor.id}`}
            className={buttonClasses({ variant: 'outline', size: 'sm' })}
          >
            Send Enquiry
          </Link>
          <Link to={`/vendor/${vendor.id}`} className={buttonClasses({ size: 'sm' })}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
