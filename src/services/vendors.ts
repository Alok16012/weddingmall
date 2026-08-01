import type { Vendor, VendorAmenities, VendorPaymentPolicies, VendorStatus } from '@/types/domain'
import { requireSupabase, toServiceError } from './supabase/client'

/** Columns selected for list views (keeps payloads small). */
const LIST_COLS =
  'id,name,category,location,price,price_unit,veg_price,non_veg_price,description,images,image,rating,status,badge,is_trending,created_at'
const DETAIL_COLS = `${LIST_COLS},email,amenities,payment_policies`

/** Raw row shape as returned by PostgREST (snake_case). */
interface VendorRow {
  id: string
  name: string
  email?: string | null
  category: string[] | null
  location: string | null
  price: string | null
  price_unit: string | null
  veg_price: string | null
  non_veg_price: string | null
  description: string | null
  images: string[] | null
  image: string | null
  rating: number | null
  status: string | null
  badge: string | null
  is_trending: boolean | null
  amenities: VendorAmenities | null
  payment_policies: VendorPaymentPolicies | null
  created_at: string
}

/** Map a DB row to the domain type. Single place where snake_case dies. */
export function mapVendor(r: VendorRow): Vendor {
  const images = (r.images ?? []).filter(Boolean)
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? '',
    category: r.category ?? [],
    location: r.location,
    price: r.price?.trim() || null,
    priceUnit: r.price_unit,
    vegPrice: r.veg_price?.trim() || null,
    nonVegPrice: r.non_veg_price?.trim() || null,
    description: r.description,
    images: images.length ? images : r.image ? [r.image] : [],
    image: r.image ?? images[0] ?? null,
    rating: r.rating,
    status: (r.status as VendorStatus) ?? 'pending',
    badge: (r.badge as Vendor['badge']) ?? '',
    isTrending: !!r.is_trending,
    amenities: r.amenities ?? {},
    paymentPolicies: r.payment_policies ?? {},
    createdAt: r.created_at,
  }
}

export type VendorSort = 'recommended' | 'rating' | 'newest' | 'name'

export interface VendorQuery {
  /** Free-text search across name + description. */
  q?: string
  /** Category slug from `vendors.category` (text[]). */
  category?: string
  /** City, matches `vendors.location`. */
  city?: string
  trendingOnly?: boolean
  badge?: string
  page?: number
  pageSize?: number
  sort?: VendorSort
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

const DEFAULT_PAGE_SIZE = 20

/** Escape PostgREST `or=` filter values (commas/parens break the grammar). */
function safeLike(input: string): string {
  return input.replace(/[,()\\*]/g, ' ').trim()
}

/**
 * Server-side filtered + sorted + paginated vendor search.
 * Only `status = active` rows are ever returned to the public app.
 */
export async function listVendors(query: VendorQuery = {}): Promise<Page<Vendor>> {
  const {
    q,
    category,
    city,
    trendingOnly,
    badge,
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    sort = 'recommended',
  } = query

  try {
    const supabase = requireSupabase()
    let req = supabase
      .from('vendors')
      .select(LIST_COLS, { count: 'exact' })
      .eq('status', 'active')

    if (category) req = req.contains('category', [category])
    if (city) req = req.eq('location', city)
    if (trendingOnly) req = req.eq('is_trending', true)
    if (badge) req = req.eq('badge', badge)

    const term = q ? safeLike(q) : ''
    if (term) req = req.or(`name.ilike.%${term}%,description.ilike.%${term}%`)

    switch (sort) {
      case 'rating':
        req = req.order('rating', { ascending: false, nullsFirst: false })
        break
      case 'newest':
        req = req.order('created_at', { ascending: false })
        break
      case 'name':
        req = req.order('name', { ascending: true })
        break
      default:
        // "Recommended" mirrors the website's merchandising: trending first, then newest.
        req = req
          .order('is_trending', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
    }

    const from = page * pageSize
    const { data, error, count } = await req.range(from, from + pageSize - 1)
    if (error) throw error

    const items = (data as unknown as VendorRow[]).map(mapVendor)
    const total = count ?? items.length
    return { items, total, page, pageSize, hasMore: from + items.length < total }
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Full vendor record for the detail screen. */
export async function getVendor(id: string): Promise<Vendor | null> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('vendors')
      .select(DETAIL_COLS)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? mapVendor(data as unknown as VendorRow) : null
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Vendors marked `is_trending` by the website admin — used on Home. */
export async function listTrending(limit = 10): Promise<Vendor[]> {
  const { items } = await listVendors({ trendingOnly: true, pageSize: limit, sort: 'newest' })
  return items
}

/** Live count per category slug, so Home never shows an empty category. */
export async function countByCategory(slug: string, city?: string): Promise<number> {
  try {
    const supabase = requireSupabase()
    let req = supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .contains('category', [slug])
    if (city) req = req.eq('location', city)
    const { count, error } = await req
    if (error) throw error
    return count ?? 0
  } catch {
    return 0
  }
}

export interface CategorySummary {
  count: number
  /** A representative photo taken from a real vendor in this category. */
  image: string | null
}

/**
 * Count + a real cover photo for a category tile. Using the vendors' own
 * imagery keeps the tiles on-subject (stock photos kept mis-representing
 * categories) and means the tiles reflect the actual catalogue.
 */
export async function categorySummary(slug: string, city?: string): Promise<CategorySummary> {
  try {
    const supabase = requireSupabase()
    let req = supabase
      .from('vendors')
      .select('image,images', { count: 'exact' })
      .eq('status', 'active')
      .contains('category', [slug])
      .not('image', 'is', null)
      .order('is_trending', { ascending: false, nullsFirst: false })
    if (city) req = req.eq('location', city)

    // Vendors belong to several categories at once, so the top-ranked row is
    // often the same for neighbouring tiles. Pull a small window and pick a
    // stable offset per slug so each tile shows a different venue.
    const { data, error, count } = await req.limit(24)
    if (error) throw error
    const rows = (data as { image: string | null; images: string[] | null }[]) ?? []
    if (rows.length === 0) return { count: count ?? 0, image: null }

    const hash = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
    const row = rows[hash % rows.length]
    return { count: count ?? 0, image: row?.image ?? row?.images?.[0] ?? null }
  } catch {
    return { count: 0, image: null }
  }
}

/** The signed-in vendor's own record, matched by their auth email. */
export async function getMyVendor(email: string): Promise<Vendor | null> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('vendors')
      .select(DETAIL_COLS)
      .ilike('email', email)
      .maybeSingle()
    if (error) throw error
    return data ? mapVendor(data as unknown as VendorRow) : null
  } catch (err) {
    throw toServiceError(err)
  }
}
