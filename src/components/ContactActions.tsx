import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Send } from 'lucide-react'
import type { Vendor } from '@/types/domain'
import { telHref, whatsappHref } from '@/lib/contact'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'

/**
 * Call · WhatsApp · Enquire — the CTA group on cards and the detail screen.
 *
 * Call and WhatsApp render only for a vendor who actually has a registered
 * number. On the live database today no vendor does (`vendors.phone` arrives
 * with migration 0001), so those two buttons are simply absent and Enquire —
 * which works against the real `leads` table — takes the full width. That is
 * deliberate: a dial button that cannot dial is exactly the dummy CTA the brief
 * rules out.
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
  const tel = telHref(vendor.phone)
  const wa = whatsappHref(vendor.whatsapp, {
    vendorName: vendor.name,
    listingRef: vendor.id.slice(0, 8).toUpperCase(),
    eventDate,
  })

  const base = cn(
    'tap inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-field)] border font-semibold',
    size === 'sm' ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm',
  )
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div
      data-tour="contact"
      className={cn('grid gap-2', tel || wa ? 'grid-cols-3' : 'grid-cols-1', className)}
    >
      {tel && (
        <a
          href={tel}
          onClick={() => track('call_vendor', { vendor_id: vendor.id, vendor_name: vendor.name })}
          className={cn(base, 'border-line bg-surface text-ink')}
          aria-label={`Call ${vendor.name}`}
        >
          <Phone className={icon} aria-hidden /> Call
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_vendor', { vendor_id: vendor.id, vendor_name: vendor.name })}
          className={cn(base, 'border-success bg-success-100 text-success')}
          aria-label={`Message ${vendor.name} on WhatsApp`}
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
