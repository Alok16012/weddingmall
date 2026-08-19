import type { Vendor, VendorAmenities, VendorPaymentPolicies, VendorStatus } from '@/types/domain'
import { requireSupabase, toServiceError } from './supabase/client'
import { hasCapability } from './supabase/capabilities'

/**
 * Columns selected for list views (keeps payloads small).
 *
 * `amenities` is small jsonb and earns its place: the cards and rows show
 * seating and floating capacity, which is the first thing anyone comparing
 * venues looks for. Without it those chips silently never rendered.
 */
const LIST_COLS =
  'id,name,category,location,price,price_unit,veg_price,non_veg_price,description,images,image,rating,status,badge,is_trending,amenities,created_at'
const DETAIL_COLS = `${LIST_COLS},email,payment_policies`

/**
 * `vendors.phone` / `vendors.whatsapp` only exist once migration 0001 has run.
 * Naming a column PostgREST does not know about fails the entire request, so
 * the projection is assembled per call from what the backend actually has.
 * The answer is probed once and memoised for the session.
 */
async function withContactCols(base: string): Promise<string> {
  return (await hasCapability('vendorContact')) ? `${base},phone,whatsapp` : base
}

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
  phone?: string | null
  whatsapp?: string | null
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
    // Blank strings are as good as absent for a dial action, so they collapse
    // to null here and the Call / WhatsApp buttons never render for them.
    phone: r.phone?.trim() || null,
    // A vendor who gave only one number is reachable on it for both.
    whatsapp: r.whatsapp?.trim() || r.phone?.trim() || null,
  }
}

export type VendorSort = 'recommended' | 'rating' | 'newest' | 'name'

export interface VendorQuery {
  /** Free-text search across name + description. */
  q?: string
  /** Category slug from `vendors.category` (text[]). */
  category?: string
  /**
   * Match a vendor listed under ANY of these slugs — an array *overlap*, not a
   * containment. This is what the Venue / Vendors / Shopping tabs filter by,
   * since each is a family of categories rather than one. Ignored when
   * `category` is set, so narrowing to a single category inside a tab still
   * works.
   */
  categories?: string[]
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
    categories,
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
      .select(await withContactCols(LIST_COLS), { count: 'exact' })
      .eq('status', 'active')

    // A single category wins over the section's family, so drilling into
    // "Banquet Halls" from inside the Venue tab narrows rather than widens.
    if (category) req = req.contains('category', [category])
    else if (categories?.length) req = req.overlaps('category', categories)
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
      .select(await withContactCols(DETAIL_COLS))
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

/**
 * Count + cover photo for EVERY category in one round trip.
 *
 * The Services screen shows all twenty categories; calling `categorySummary`
 * per tile would fire twenty requests on mount. Category membership lives in a
 * text[] on the vendor, so one narrow select over the active rows (~200, two
 * columns) is both smaller and faster than twenty counting queries.
 */
export async function categoryDirectory(city?: string): Promise<Record<string, CategorySummary>> {
  try {
    const supabase = requireSupabase()
    let req = supabase.from('vendors').select('category,image,images,is_trending').eq('status', 'active')
    if (city) req = req.eq('location', city)

    const { data, error } = await req
    if (error) throw error

    const rows =
      (data as { category: string[] | null; image: string | null; images: string[] | null; is_trending: boolean | null }[]) ?? []

    const out: Record<string, CategorySummary> = {}
    const covers: Record<string, string[]> = {}
    for (const row of rows) {
      const cover = row.image ?? row.images?.[0] ?? null
      for (const slug of row.category ?? []) {
        const entry = (out[slug] ??= { count: 0, image: null })
        entry.count += 1
        if (!cover) continue
        // A trending vendor leads the shortlist; the rest queue behind it.
        const queue = (covers[slug] ??= [])
        if (queue.length >= 8) continue
        if (row.is_trending) queue.unshift(cover)
        else queue.push(cover)
      }
    }

    // Vendors list themselves under several categories at once, so the same
    // photo would otherwise head half the venue rows. Each category takes the
    // first cover nobody above it has claimed, which is enough to make the
    // directory look like a directory rather than one venue repeated.
    const used = new Set<string>()
    for (const [slug, entry] of Object.entries(out)) {
      const queue = covers[slug] ?? []
      const pick = queue.find((c) => !used.has(c)) ?? queue[0] ?? null
      if (pick) used.add(pick)
      entry.image = pick
    }
    return out
  } catch (err) {
    throw toServiceError(err)
  }
}

/** The signed-in vendor's own record, matched by their auth email. */
export async function getMyVendor(email: string): Promise<Vendor | null> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('vendors')
      .select(await withContactCols(DETAIL_COLS))
      .ilike('email', email)
      .maybeSingle()
    if (error) throw error
    return data ? mapVendor(data as unknown as VendorRow) : null
  } catch (err) {
    throw toServiceError(err)
  }
}
