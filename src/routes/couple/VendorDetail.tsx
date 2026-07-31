import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Car, Check, Heart, Images, MapPin, MessageCircle, Star, Users, Wifi } from 'lucide-react'
import type { Vendor } from '@/types/domain'
import { categoryLabel } from '@/types/domain'
import { getVendor } from '@/services/vendors'
import { platePrice } from '@/components/VendorCard'
import { buttonClasses } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { GalleryLightbox } from '@/components/GalleryLightbox'
import { useFavourites } from '@/hooks/useFavourites'
import { cn } from '@/lib/cn'

/** Boolean amenity flags → labelled chips (only the true ones are shown). */
const FLAGS: { key: keyof Vendor['amenities']; label: string; icon?: typeof Wifi }[] = [
  { key: 'bridalRoom', label: 'Bridal room' },
  { key: 'diningArea', label: 'Dining area' },
  { key: 'parkingArea', label: 'Parking', icon: Car },
  { key: 'garden', label: 'Garden' },
  { key: 'swimmingPool', label: 'Swimming pool' },
  { key: 'electricityBackup', label: 'Power backup' },
  { key: 'wifi', label: 'Wi-Fi', icon: Wifi },
]

const COUNTS: { key: keyof Vendor['amenities']; label: string }[] = [
  { key: 'seatingCapacity', label: 'Seating capacity' },
  { key: 'parkingCapacity', label: 'Parking capacity' },
  { key: 'noOfHalls', label: 'Halls' },
  { key: 'noOfLawns', label: 'Lawns' },
  { key: 'noOfRooms', label: 'Rooms' },
  { key: 'noOfACRooms', label: 'AC rooms' },
]

const POLICIES: { key: keyof Vendor['paymentPolicies']; label: string }[] = [
  { key: 'advancePayment', label: 'Advance payment' },
  { key: 'cancellationPolicy', label: 'Cancellation' },
  { key: 'paymentModes', label: 'Payment modes' },
  { key: 'additionalCharges', label: 'Additional charges' },
]

export default function VendorDetail() {
  const { id = '' } = useParams()
  const { isFavourite, toggle } = useFavourites()
  const [galleryAt, setGalleryAt] = useState<number | null>(null)

  const { data: vendor, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id),
  })

  if (isLoading) {
    return (
      <div>
        <ScreenHeader title="" back />
        <Skeleton className="mx-4 h-56 rounded-[var(--radius-card)]" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !vendor) {
    return (
      <div>
        <ScreenHeader title="Vendor" back />
        <ErrorState onRetry={() => refetch()} message="This vendor could not be found." />
      </div>
    )
  }

  const fav = isFavourite(vendor.id)
  const media = vendor.images.map((url, i) => ({ id: `${vendor.id}-${i}`, url, alt: vendor.name, order: i }))
  const price = platePrice(vendor)
  const counts = COUNTS.filter((c) => {
    const v = vendor.amenities[c.key]
    return typeof v === 'string' && v.trim() !== ''
  })
  const flags = FLAGS.filter((f) => vendor.amenities[f.key] === true)
  const policies = POLICIES.filter((p) => {
    const v = vendor.paymentPolicies[p.key]
    return typeof v === 'string' && v.trim() !== ''
  })

  return (
    <div className="pb-28">
      {galleryAt !== null && media.length > 0 && (
        <GalleryLightbox
          media={media}
          startIndex={galleryAt}
          title={vendor.name}
          onClose={() => setGalleryAt(null)}
        />
      )}

      <ScreenHeader
        title=""
        back
        right={
          <button
            onClick={() => toggle(vendor.id)}
            aria-pressed={fav}
            aria-label={fav ? 'Remove from shortlist' : 'Add to shortlist'}
            className="tap grid h-10 w-10 place-items-center rounded-full border border-line bg-surface"
          >
            <Heart
              className={cn('h-5 w-5', fav ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-ink-soft')}
              aria-hidden
            />
          </button>
        }
      />

      {/* Gallery */}
      {media.length > 0 && (
        <div className="relative">
          <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4">
            {media.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setGalleryAt(i)}
                className="shrink-0 snap-center"
                aria-label={`Open photo ${i + 1} of ${media.length}`}
              >
                <img
                  src={m.url}
                  alt={m.alt}
                  className="h-56 w-[78vw] max-w-[330px] rounded-[var(--radius-card)] bg-surface-2 object-cover"
                />
              </button>
            ))}
          </div>
          {media.length > 1 && (
            <button
              onClick={() => setGalleryAt(0)}
              className="absolute bottom-3 right-6 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[#221f20]/80 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Images className="h-3.5 w-3.5" aria-hidden /> {media.length} photos
            </button>
          )}
        </div>
      )}

      <div className="space-y-6 px-4 pt-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[1.8rem] leading-tight text-ink">{vendor.name}</h1>
            {vendor.rating != null && (
              <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-field)] bg-success px-2 py-1 text-sm font-bold text-white">
                <Star className="h-3.5 w-3.5 fill-white" aria-hidden />
                <span className="tnum">{vendor.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          {vendor.location && (
            <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-4 w-4" aria-hidden /> {vendor.location}
            </p>
          )}
          {vendor.category.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {vendor.category.slice(0, 6).map((c) => (
                <Link
                  key={c}
                  to={`/explore?category=${c}`}
                  className="rounded-[var(--radius-pill)] border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-soft"
                >
                  {categoryLabel(c)}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Pricing</p>
          <p className="tnum mt-0.5 text-xl font-bold text-ink">{price ?? 'Price on Request'}</p>
          {vendor.paymentPolicies.gstIncluded && (
            <p className="mt-1 text-xs text-success">GST included</p>
          )}
        </div>

        {vendor.description && (
          <section>
            <h2 className="mb-1.5 text-xl text-ink">About</h2>
            <p className="text-[15px] leading-relaxed text-ink-soft">{vendor.description}</p>
          </section>
        )}

        {/* Capacity & facilities */}
        {(counts.length > 0 || flags.length > 0) && (
          <section>
            <h2 className="mb-2 text-xl text-ink">Capacity &amp; Facilities</h2>
            {counts.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {counts.map((c) => (
                  <div key={c.key} className="rounded-[var(--radius-field)] border border-line bg-surface p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Users className="h-3.5 w-3.5" aria-hidden /> {c.label}
                    </div>
                    <div className="tnum mt-0.5 font-bold text-ink">
                      {String(vendor.amenities[c.key])}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {flags.length > 0 && (
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {flags.map((f) => (
                  <li key={f.key} className="flex items-center gap-2 text-sm text-ink-soft">
                    <Check className="h-4 w-4 shrink-0 text-success" aria-hidden /> {f.label}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Policies */}
        {policies.length > 0 && (
          <section>
            <h2 className="mb-2 text-xl text-ink">Payment &amp; Policies</h2>
            <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              {policies.map((p) => (
                <div key={p.key} className="p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.label}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {String(vendor.paymentPolicies[p.key])}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky enquiry bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center gap-3 border-t border-line bg-surface/97 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{price ? 'Starting from' : 'Pricing'}</p>
          <p className="tnum truncate text-sm font-bold text-ink">{price ?? 'On request'}</p>
        </div>
        <Link to={`/enquiry/${vendor.id}`} className={buttonClasses({ className: 'flex-1' })}>
          <MessageCircle className="h-4 w-4" /> Send Enquiry
        </Link>
      </div>
    </div>
  )
}
