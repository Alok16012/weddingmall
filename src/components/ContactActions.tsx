import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Send } from 'lucide-react'
import type { Vendor } from '@/types/domain'
import { resolveVendorContact } from '@/lib/contact'
import { BRAND_NAME } from '@/config/company'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'

/**
 * Call · WhatsApp · Enquire — the CTA group on cards and the detail screen.
 *
 * A vendor with a registered number is reached directly. Nobody has one yet, so
 * both actions currently route to the Wedding Mall desk — a real staffed line,
 * carrying the listing name and reference so the team knows what is being asked
 * about. `viaDesk` is surfaced as visible text wherever there is room for it:
 * the caller has to know they are reaching Wedding Mall and not the venue.
 */
export function ContactActions({
  vendor,
  eventDate,
  size = 'md',
  className,
}: {
  vendor: Vendor
  /** Included in the WhatsApp opener when the user has already picked a date. */
  eventDate?: string | null
  size?: 'sm' | 'md'
  className?: string
}) {
  const { tel, wa, viaDesk } = resolveVendorContact(vendor, { eventDate })

  const base = cn(
    'tap inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-field)] border font-semibold',
    size === 'sm' ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm',
  )
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  const via = viaDesk ? ` (${BRAND_NAME} helpdesk)` : ''

  return (
    <div className={className}>
      <div data-tour="contact" className={cn('grid gap-2', tel || wa ? 'grid-cols-3' : 'grid-cols-1')}>
        {tel && (
          <a
            href={tel}
            onClick={() =>
              track('call_vendor', { vendor_id: vendor.id, vendor_name: vendor.name, via_desk: viaDesk })
            }
            className={cn(base, 'border-line bg-surface text-ink')}
            aria-label={`Call about ${vendor.name}${via}`}
          >
            <Phone className={icon} aria-hidden /> Call
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track('whatsapp_vendor', { vendor_id: vendor.id, vendor_name: vendor.name, via_desk: viaDesk })
            }
            className={cn(base, 'border-success bg-success-100 text-success')}
            aria-label={`WhatsApp about ${vendor.name}${via}`}
          >
            <MessageCircle className={icon} aria-hidden /> WhatsApp
          </a>
        )}
        <Link
          to={`/enquiry/${vendor.id}`}
          data-tour="enquire"
          className={cn(base, 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white')}
          aria-label={`Send an enquiry to ${vendor.name}`}
        >
          <Send className={icon} aria-hidden /> Enquire
        </Link>
      </div>

      {/* Said plainly, because the person tapping Call believes they are ringing
          the venue. Only the roomy size has space for it; the compact card relies
          on the aria-label above and the detail screen, which always shows it. */}
      {viaDesk && size === 'md' && (
        <p className="mt-1.5 text-center text-xs text-muted">
          Call and WhatsApp reach the {BRAND_NAME} helpdesk, who will connect you with this listing.
        </p>
      )}
    </div>
  )
}

/**
 * The price line. When a real per-plate price exists it is shown as text; when
 * it does not, the slot becomes the enquiry action rather than the words "Price
 * on Request", which asked the user to do something and then gave them no way
 * to do it.
 */
export function PriceOrRequest({
  vendor,
  price,
  className,
}: {
  vendor: Vendor
  price: string | null
  className?: string
}) {
  if (price) {
    return (
      <span className={cn('tnum text-sm font-bold text-[var(--color-primary)]', className)}>
        {price}
      </span>
    )
  }
  return (
    <Link
      to={`/enquiry/${vendor.id}`}
      className={cn(
        'tap inline-flex items-center gap-1 text-sm font-bold text-[var(--color-primary)] underline decoration-[var(--color-primary)]/40 underline-offset-4',
        className,
      )}
      aria-label={`Request pricing from ${vendor.name}`}
    >
      Request Price
    </Link>
  )
}
