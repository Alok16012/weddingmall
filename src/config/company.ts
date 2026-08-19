/**
 * Company and brand facts, in one place.
 *
 * The customer-facing product is **Wedding Mall**. `weddingmall.online` is the
 * domain and `Wedding Mall Online Pvt. Ltd.` is the registered entity — both are
 * correct in legal/contact contexts, neither is the brand name shown in the UI.
 * Import from here rather than typing any of it, so the name, the numbers and
 * the Patna address cannot drift between the header, the footer, Contact, the
 * biodata PDF footer and the store listings.
 *
 * Source: company business card supplied by the owner.
 */

/** Customer-facing product name. Never render "Wedding Mall.Online" to a user. */
export const BRAND_NAME = 'Wedding Mall'

/** Registered entity — About, Contact, Terms, Privacy, footer. */
export const LEGAL_NAME = 'Wedding Mall Online Pvt. Ltd.'

export const TAGLINE = "India's Fastest Emerging Online Wedding Marketplace"

export const PROPOSITION = 'One Destination. Endless Wedding Possibilities.'

export const WEBSITE_URL = 'https://www.weddingmall.online'
export const WEBSITE_LABEL = 'www.weddingmall.online'

export const EMAIL = 'contact@weddingmall.online'

/**
 * Company contact numbers. `e164` drives `tel:`/`wa.me` links, `display` is what
 * a human reads — they differ only in punctuation, so keep them in one object
 * rather than reformatting at each call site.
 */
export const PHONES = [
  { e164: '+919560679117', display: '+91 95606 79117' },
  { e164: '+919234214095', display: '+91 92342 14095' },
] as const

/** The number used for company WhatsApp enquiries (wa.me wants no '+'). */
export const WHATSAPP_NUMBER = PHONES[0].e164.replace('+', '')

export const ADDRESS = {
  line1: '1st Floor, Vidya Complex, Near Hotel Sidh Vedanta',
  line2: 'West Ramkrishna Nagar, Patna, Bihar 800027',
  country: 'India',
} as const

/** Single-line address, for meta tags and share text. */
export const ADDRESS_ONE_LINE = `${ADDRESS.line1}, ${ADDRESS.line2}, ${ADDRESS.country}`

/**
 * Maps deep link for the office. `?q=` with the encoded address works on
 * Android, iOS and desktop web alike, so no per-platform branching is needed.
 */
export const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ADDRESS_ONE_LINE,
)}`

/** Default copy for Share App, per spec. */
export const SHARE_TEXT = `Planning a wedding? Explore venues, vendors, shopping and wedding ideas on ${BRAND_NAME}.`
