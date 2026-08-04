import { Link } from 'react-router-dom'
import { Heart, Images, MapPin, Star, Users } from 'lucide-react'
import { Img } from './ui/Img'
import type { Vendor } from '@/types/domain'
import { cn } from '@/lib/cn'
import { platePrice } from './VendorCard'
import { useFavourites } from '@/hooks/useFavourites'

const BADGE_TONE: Record<string, string> = {
  'Most Preferred': 'bg-[var(--color-primary)] text-white',
  Preferred: 'bg-[var(--color-accent)] text-ink',
  'Budget Venue': 'bg-success text-white',
  Promotional: 'bg-[var(--color-primary-100)] text-[var(--color-primary)]',
}

/**
 * Dense search-result row — the MakeMyTrip listing pattern: media on the left,
 * tightly-packed detail on the right, price bottom-right, hairline separators.
 * Much higher information density than a stacked card.
 */
export function VendorRow({ vendor, index }: { vendor: Vendor; index?: number }) {
  const { isFavourite, toggle } = useFavourites()
  const fav = isFavourite(vendor.id)
  const price = platePrice(vendor)
  const seating = vendor.amenities.seatingCapacity
  const floating = vendor.amenities.floatingCapacity

  return (
    <article
      style={index !== undefined ? ({ '--i': index } as React.CSSProperties) : undefined}
      className={cn(
        'pressable elevate-2 relative overflow-hidden rounded-[var(--radius-card)] bg-surface',
        index !== undefined && 'reveal',
      )}
    >
      <Link to={`/vendor/${vendor.id}`} className="flex gap-3 p-2.5">
        {/* Media */}
        <div className="relative h-[104px] w-[104px] shrink-0">
          <Img
            src={vendor.image}
            alt={vendor.name}
            width={104}
            height={104}
            wrapperClassName="h-[104px] w-[104px]"
            fallback={<Images className="h-6 w-6" aria-hidden />}
          />
          {vendor.images.length > 1 && (
            <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-ink/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <Images className="h-2.5 w-2.5" aria-hidden /> {vendor.images.length}
            </span>
          )}
        </div>

        {/* Detail */}
        <div className="flex min-w-0 flex-1 flex-col">
          {vendor.badge && (
            <span
              className={cn(
                'mb-1 w-fit rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                BADGE_TONE[vendor.badge] ?? 'bg-ink/85 text-white',
              )}
            >
              {vendor.badge}
            </span>
          )}

          <h3 className="truncate text-[15px] font-bold leading-tight text-ink">{vendor.name}</h3>

          {vendor.location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {vendor.location}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {vendor.rating != null && (
              <span className="inline-flex items-center gap-0.5 rounded bg-success px-1.5 py-0.5 text-[11px] font-bold text-white">
                <Star className="h-2.5 w-2.5 fill-white" aria-hidden />
                <span className="tnum">{vendor.rating.toFixed(1)}</span>
              </span>
            )}
            {seating && (
              <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-soft">
                <Users className="h-2.5 w-2.5" aria-hidden /> {seating} seated
              </span>
            )}
            {floating && (
              <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-soft">
                <Users className="h-2.5 w-2.5" aria-hidden /> {floating} floating
              </span>
            )}
          </div>

          {/* Price rail */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
            <span className="tnum truncate text-[13px] font-bold text-[var(--color-primary)]">
              {price ?? 'Price on Request'}
            </span>
            <span className="btn-primary-surface shrink-0 rounded-[var(--radius-field)] px-3.5 py-1.5 text-[11px] font-bold">
              Enquire
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggle(vendor.id)}
        aria-pressed={fav}
        aria-label={fav ? 'Remove from shortlist' : 'Add to shortlist'}
        className="tap absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full"
      >
        <Heart
          className={cn('h-4 w-4', fav ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-muted')}
          aria-hidden
        />
      </button>
    </article>
  )
}
