import { BRAND_NAME } from '@/config/company'

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

/** `wa.me` link, or null when the number is unusable. */
export function whatsappHref(raw: string | null | undefined, ctx: WhatsappContext = {}): string | null {
  if (!raw) return null
  const digits = toWhatsappDigits(raw)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage(ctx))}`
}
