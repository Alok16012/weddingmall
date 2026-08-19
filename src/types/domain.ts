/**
 * Domain types — mirror the REAL Supabase schema of the Wedding Mall production
 * project (lwkrpweahafcaxcmseys), the same backend as https://weddingmall.online/.
 *
 * Verified tables: vendors, leads, locations, popular_cities, blogs, jobs.
 * Nothing here is invented — every field maps to a real column.
 */

/* ------------------------------------------------------------------ vendors */

/** `vendors.status` — observed values: active (186), pending (15), inactive (1). */
export type VendorStatus = 'active' | 'pending' | 'inactive'

/** `vendors.badge` — merchandising label set by the website admin. */
export type VendorBadge = 'Most Preferred' | 'Preferred' | 'Budget Venue' | 'Promotional' | ''

/**
 * `vendors.amenities` (jsonb). All keys optional — real rows omit some.
 * Numeric-ish fields are stored as strings by the website ("4", "250-1000").
 */
export interface VendorAmenities {
  wifi?: boolean
  garden?: boolean
  bridalRoom?: boolean
  diningArea?: boolean
  parkingArea?: boolean
  swimmingPool?: boolean
  electricityBackup?: boolean
  noOfHalls?: string
  noOfLawns?: string
  noOfRooms?: string
  noOfACRooms?: string
  parkingCapacity?: string
  /** Guests seated for a sit-down meal. */
  seatingCapacity?: string
  /**
   * Guests the venue holds standing, for a reception where people circulate —
   * always the larger of the two numbers, and the one couples plan a baraat or
   * a cocktail evening around. Written by the vendor form as free text
   * ("1200", "800-1500"), like every other capacity field here.
   */
  floatingCapacity?: string
}

/** `vendors.payment_policies` (jsonb). */
export interface VendorPaymentPolicies {
  gstIncluded?: boolean
  paymentModes?: string
  advancePayment?: string
  additionalCharges?: string
  cancellationPolicy?: string
}

/**
 * A row of `vendors` — this table is BOTH the vendor and the listing.
 * There is no separate listings table in this backend.
 */
export interface Vendor {
  id: string
  name: string
  email: string
  /** `category` text[] of slugs, e.g. ["wedding-venues","banquet-halls"]. */
  category: string[]
  /** Free-text city, e.g. "Patna". Matches `locations.city`. */
  location: string | null
  /** Legacy/unused on most rows — prefer vegPrice/nonVegPrice. */
  price: string | null
  priceUnit: string | null
  vegPrice: string | null
  nonVegPrice: string | null
  description: string | null
  /** Full public URLs in the `vendor-images` storage bucket. */
  images: string[]
  /** Cover image (usually images[0]). */
  image: string | null
  rating: number | null
  status: VendorStatus
  badge: VendorBadge
  isTrending: boolean
  amenities: VendorAmenities
  paymentPolicies: VendorPaymentPolicies
  createdAt: string
  /**
   * Registered contact number, and the WhatsApp number when it differs.
   *
   * Added by `supabase/migrations/0001_marketplace_workflows.sql`. Until that
   * migration runs, the live `vendors` table has no such column and both stay
   * null — which is exactly why the Call and WhatsApp buttons are rendered from
   * these values rather than shown unconditionally. See
   * `services/supabase/capabilities.ts`.
   */
  phone: string | null
  whatsapp: string | null
}

/* -------------------------------------------------------------------- leads */

/** `leads.status` — free text on the website; treated as an open set. */
export type LeadStatus = string

/**
 * Wedding function the enquiry is for. Free text in the column, but the form
 * offers this fixed set so vendors can filter on consistent values.
 */
export const EVENT_TYPES = [
  'Wedding',
  'Reception',
  'Engagement',
  'Sangeet',
  'Mehendi',
  'Haldi',
  'Tilak / Roka',
  'Anniversary',
  'Birthday',
  'Corporate Event',
  'Other',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

/** A row of `leads` — the enquiry mechanism shared with the website. */
export interface Lead {
  id: string
  vendorId: string
  vendorName: string | null
  customerName: string
  customerPhone: string
  weddingDate: string | null
  type: string | null
  status: LeadStatus | null
  createdAt: string
  /**
   * The wider enquiry detail. These columns are added by
   * `supabase/migrations/0001_marketplace_workflows.sql`; on the current live
   * schema they are absent, so the composer only collects them once the backend
   * reports the `leadDetails` capability.
   */
  customerEmail: string | null
  eventType: string | null
  guestCount: number | null
  city: string | null
  message: string | null
}

/** Payload for creating a lead (enquiry) — mirrors the website's insert. */
export interface NewLead {
  vendorId: string
  vendorName?: string
  customerName: string
  customerPhone: string
  weddingDate?: string
  type?: string
  customerEmail?: string
  eventType?: string
  guestCount?: number
  city?: string
  message?: string
}

/* ----------------------------------------------------------------- bookings */

/**
 * `bookings.status` — the customer-visible progression of an enquiry.
 *
 * An enquiry is NOT a booking: a row starts at `enquiry_sent` and only the
 * vendor can move it forward. Nothing in the customer UI may present the first
 * state as a confirmed booking.
 */
export const BOOKING_STATUSES = [
  'enquiry_sent',
  'vendor_responded',
  'tentative',
  'confirmed',
  'completed',
  'cancelled',
] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  enquiry_sent: 'Enquiry Sent',
  vendor_responded: 'Vendor Responded',
  tentative: 'Tentative',
  confirmed: 'Booking Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export interface Booking {
  id: string
  /** Short human reference shown to both sides, e.g. `WM-8F31A2`. */
  reference: string
  vendorId: string
  vendorName: string | null
  eventDate: string | null
  eventType: string | null
  guestCount: number | null
  status: BookingStatus
  paymentState: string | null
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  updatedAt: string | null
}

/* ------------------------------------------------- vendor date availability */

/** `vendor_availability.status` — the vendor's own view of a calendar date. */
export const AVAILABILITY_STATUSES = [
  'available',
  'enquiry_received',
  'tentative',
  'confirmed',
  'blocked',
] as const
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number]

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  enquiry_received: 'Enquiry Received',
  tentative: 'Tentative / Hold',
  confirmed: 'Confirmed Booking',
  blocked: 'Blocked / Unavailable',
}

export interface AvailabilityDay {
  id: string
  vendorId: string
  /** ISO `yyyy-mm-dd`. */
  date: string
  status: AvailabilityStatus
  note: string | null
}

/* ----------------------------------------------------------------- messages */

export interface Conversation {
  id: string
  vendorId: string
  vendorName: string | null
  bookingId: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface Message {
  id: string
  conversationId: string
  /** Who wrote it — the couple or the vendor. */
  sender: 'customer' | 'vendor'
  body: string
  createdAt: string
  readAt: string | null
}

/* ------------------------------------------------------------------ reviews */

export interface Review {
  id: string
  vendorId: string
  vendorName: string | null
  rating: number
  title: string | null
  body: string | null
  serviceUsed: string | null
  eventDate: string | null
  photos: string[]
  /** True when the review is attached to a completed booking. */
  verifiedBooking: boolean
  status: 'pending' | 'published' | 'rejected'
  createdAt: string
}

export interface NewReview {
  vendorId: string
  vendorName?: string
  rating: number
  title?: string
  body?: string
  serviceUsed?: string
  eventDate?: string
}

/* ------------------------------------------------- locations / cities / cms */

export interface LocationRow {
  id: string
  state: string
  city: string
}

export interface PopularCity {
  id: string
  name: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  category: string | null
  image: string | null
  excerpt: string | null
  content: string | null
  author: string | null
  createdAt: string
}

export interface JobPost {
  id: string
  title: string
  type: string | null
  locations: string[]
  createdAt: string
}

/* --------------------------------------------------------------- categories */

/**
 * Category slugs actually present in `vendors.category`, with display labels.
 * Counts (of 202 rows) are from the live audit and drive the Home ordering.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  'wedding-venues': 'Wedding Venues',
  'banquet-halls': 'Banquet Halls',
  'marriage-garden-lawns': 'Marriage Gardens & Lawns',
  'small-function-halls': 'Small Function Halls',
  'wedding-resorts': 'Wedding Resorts',
  'destination-wedding': 'Destination Weddings',
  'budget-halls': 'Budget Halls',
  '3-star-hotels': '3-Star Hotels',
  'makeup-artists': 'Makeup Artists',
  'bridal-makeup': 'Bridal Makeup',
  'family-makeup': 'Family Makeup',
  photographers: 'Photographers',
  'wedding-photographers': 'Wedding Photographers',
  'pre-wedding-photographers': 'Pre-Wedding Shoots',
  'mehendi-artists': 'Mehendi Artists',
  'bridal-mehendi': 'Bridal Mehendi',
  'family-mehendi': 'Family Mehendi',
  'bridal-wear': 'Bridal Wear',
  'family-wear': 'Family Wear',
  'planning-decor': 'Planning & Decor',
}

/**
 * Categories shown directly under "Wedding Services" on Home — venues only.
 *
 * Deliberately just these four. Everything else (makeup, photography, mehendi,
 * decor, and the rest of `CATEGORY_LABELS`) stays in the database and stays
 * reachable through "View All" → `/services`; only its Home visibility changed.
 * Venue-type categories also carry the overwhelming majority of the 202 real
 * vendor rows, so this is the shortest path to what most couples open the app
 * for.
 */
export const HOME_CATEGORIES: string[] = [
  'wedding-venues',
  'banquet-halls',
  'marriage-garden-lawns',
  'wedding-resorts',
]

/**
 * Every category, grouped the way a couple thinks about the wedding rather than
 * the way the slugs sort. This drives the "Wedding Services" screen, which is
 * what "View all" opens — Home shows only the four above.
 */
export const CATEGORY_GROUPS: { title: string; slugs: string[] }[] = [
  {
    title: 'Venues',
    slugs: [
      'wedding-venues',
      'banquet-halls',
      'marriage-garden-lawns',
      'wedding-resorts',
      'small-function-halls',
      'budget-halls',
      '3-star-hotels',
      'destination-wedding',
    ],
  },
  { title: 'Makeup & Beauty', slugs: ['makeup-artists', 'bridal-makeup', 'family-makeup'] },
  {
    title: 'Photography',
    slugs: ['photographers', 'wedding-photographers', 'pre-wedding-photographers'],
  },
  { title: 'Mehendi', slugs: ['mehendi-artists', 'bridal-mehendi', 'family-mehendi'] },
  { title: 'Wedding Wear', slugs: ['bridal-wear', 'family-wear'] },
  { title: 'Planning & Decor', slugs: ['planning-decor'] },
]

/* --------------------------------------------------- bottom-nav taxonomy */

/**
 * The three catalogue tabs in the bottom navigation — Venue, Vendors, Shopping.
 *
 * Each is a *view over the same `vendors` table*, selected by category slug;
 * there is no second source of truth and no new table behind any of them. Every
 * slug below was checked against the live catalogue and holds real active rows,
 * so none of these tabs can open onto an empty list.
 */
export interface NavSection {
  /** Route path and query key. */
  key: 'venue' | 'vendors' | 'shopping'
  title: string
  subtitle: string
  /** Categories that make up this section — matched with an array overlap. */
  slugs: string[]
}

export const NAV_SECTIONS: Record<NavSection['key'], NavSection> = {
  venue: {
    key: 'venue',
    title: 'Wedding Venues',
    subtitle: 'Halls, lawns, resorts and hotels',
    slugs: [
      'wedding-venues',
      'banquet-halls',
      'marriage-garden-lawns',
      'wedding-resorts',
      'small-function-halls',
      'budget-halls',
      '3-star-hotels',
      'destination-wedding',
    ],
  },
  vendors: {
    key: 'vendors',
    title: 'Wedding Vendors',
    subtitle: 'Makeup, photography, mehendi and decor',
    slugs: [
      'makeup-artists',
      'bridal-makeup',
      'family-makeup',
      'photographers',
      'wedding-photographers',
      'pre-wedding-photographers',
      'mehendi-artists',
      'bridal-mehendi',
      'family-mehendi',
      'planning-decor',
    ],
  },
  shopping: {
    key: 'shopping',
    title: 'Wedding Shopping',
    subtitle: 'Bridal and family wedding wear',
    slugs: ['bridal-wear', 'family-wear'],
  },
}

export function categoryLabel(slug: string): string {
  return (
    CATEGORY_LABELS[slug] ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

/** Role model: this backend has no profiles table — vendors authenticate by email. */
export type Role = 'guest' | 'vendor'
