import { BRAND_NAME, PHONES, WHATSAPP_NUMBER } from '@/config/company'
import type { Vendor } from '@/types/domain'

/**
 * Phone / WhatsApp deep links.
 *
 * `tel:` opens the dialer on Android, the native calling flow on iOS and the
 * system handler on desktop web. `https://wa.me/…` is WhatsApp's own universal
 * link: it opens the installed app on both mobile platforms and WhatsApp Web in
 * a desktop browser, which is the one form that needs no per-platform branching.
 */

/** Digits only, with India's country code, as `wa.me` requires. */
export function toWhatsappDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

/** `tel:` target, or null when the number is unusable. */
export function telHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  return digits.replace(/\D/g, '').length >= 10 ? `tel:${digits}` : null
}

export interface WhatsappContext {
  /** Vendor or venue name, included when known. */
  vendorName?: string | null
  /** Listing reference so the vendor can find the row being asked about. */
  listingRef?: string | null
  /** Event date in ISO `yyyy-mm-dd`, included when the user has chosen one. */
  eventDate?: string | null
}

/**
 * The opening message. The spec fixes the first sentence; name, reference and
 * date are appended only when we genuinely have them, so the vendor never
 * receives a half-filled template.
 */
export function whatsappMessage(ctx: WhatsappContext = {}): string {
  const lines = [
    `Hi, I found your listing on ${BRAND_NAME} and would like to know more about availability and pricing.`,
  ]
  if (ctx.vendorName) lines.push(`Listing: ${ctx.vendorName}`)
  if (ctx.listingRef) lines.push(`Reference: ${ctx.listingRef}`)
  if (ctx.eventDate) lines.push(`Event date: ${ctx.eventDate}`)
  return lines.join('\n')
}

/** Where a Call / WhatsApp tap actually lands. */
export interface VendorContact {
  /** `tel:` target, or null when nobody can be reached. */
  tel: string | null
  /** `wa.me` target, or null when nobody can be reached. */
  wa: string | null
  /**
   * True when the tap reaches the Wedding Mall desk rather than the vendor.
   * Every surface that shows these actions must say so — a Call button that
   * silently rings someone other than the business named above it is worse than
   * no button at all.
   */
  viaDesk: boolean
}

/**
 * Resolve the contact route for a listing.
 *
 * Vendors keep their own number when they have one. No vendor does today — the
 * live `vendors` table has no phone column at all, only `email` — so until
 * migration 0001 lands and the numbers are filled in, both actions route to the
 * Wedding Mall desk, which is a real, staffed number rather than a dead button.
 * The moment a vendor row carries a number, that vendor's own line wins here and
 * every surface follows without further change.
 */
export function resolveVendorContact(
  vendor: Pick<Vendor, 'id' | 'name' | 'phone' | 'whatsapp'>,
  ctx: Omit<WhatsappContext, 'vendorName' | 'listingRef'> = {},
): VendorContact {
  const listingRef = vendor.id.slice(0, 8).toUpperCase()
  const own = { vendorName: vendor.name, listingRef, ...ctx }

  const tel = telHref(vendor.phone)
  const wa = whatsappHref(vendor.whatsapp ?? vendor.phone, own)
  if (tel || wa) return { tel, wa, viaDesk: false }

  // The desk is answering, so the listing name and reference are the whole point
  // of the message — without them the team cannot tell which venue is meant.
  return {
    tel: telHref(PHONES[0].e164),
    wa: whatsappHref(WHATSAPP_NUMBER, own),
    viaDesk: true,
  }
}

/** `wa.me` link, or null when the number is unusable. */
export function whatsappHref(raw: string | null | undefined, ctx: WhatsappContext = {}): string | null {
  if (!raw) return null
  const digits = toWhatsappDigits(raw)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage(ctx))}`
}
