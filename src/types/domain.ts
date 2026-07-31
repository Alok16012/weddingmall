/**
 * Domain types — mirror the REAL Supabase schema of the WeddingMall production
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
  seatingCapacity?: string
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
}

/* -------------------------------------------------------------------- leads */

/** `leads.status` — free text on the website; treated as an open set. */
export type LeadStatus = string

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
}

/** Payload for creating a lead (enquiry) — mirrors the website's insert. */
export interface NewLead {
  vendorId: string
  vendorName?: string
  customerName: string
  customerPhone: string
  weddingDate?: string
  type?: string
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

/** Primary categories surfaced on Home (highest real vendor counts first). */
export const HOME_CATEGORIES: string[] = [
  'wedding-venues',
  'banquet-halls',
  'marriage-garden-lawns',
  'wedding-resorts',
  'makeup-artists',
  'photographers',
  'mehendi-artists',
  'planning-decor',
]

export function categoryLabel(slug: string): string {
  return (
    CATEGORY_LABELS[slug] ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

/** Role model: this backend has no profiles table — vendors authenticate by email. */
export type Role = 'guest' | 'vendor'
