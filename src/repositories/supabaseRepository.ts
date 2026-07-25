import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import type {
  Booking,
  Conversation,
  Enquiry,
  EnquiryStage,
  Listing,
  MediaItem,
  Message,
  Package,
  PlannerMilestone,
  ProductCategory,
  ProductItem,
  Review,
  VendorCategory,
} from '@/types/domain'
import type {
  BookingRepository,
  ChatRepository,
  EnquiryRepository,
  FavouriteRepository,
  ListingQuery,
  ListingRepository,
  PlannerRepository,
  ProductRepository,
  Repositories,
  VendorRepository,
} from './types'

// Patna centre — distance is derived from server coordinates (spec DISC-01).
const REF = { lat: 25.5941, lng: 85.1376 }
function haversineKm(lat?: number | null, lng?: number | null): number {
  if (lat == null || lng == null) return 0
  const R = 6371
  const dLat = ((lat - REF.lat) * Math.PI) / 180
  const dLng = ((lng - REF.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((REF.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

function sb(): SupabaseClient {
  const client = getSupabase()
  if (!client) throw new Error('Supabase client unavailable — check VITE_SUPABASE_* env.')
  return client
}

/* ----------------------------- row mappers ------------------------------ */

interface MediaRow { id: string; url: string; alt: string; order: number }
interface PackageRow {
  id: string
  name: string
  price_minor: number
  currency: string
  price_unit: string | null
  inclusions: string[]
  active: boolean
}
interface ListingRow {
  id: string
  vendor_id: string
  category: VendorCategory
  title: string
  description: string
  city: string
  lat: number | null
  lng: number | null
  price_mode: 'fixed' | 'on_request'
  from_price_minor: number | null
  currency: string
  price_unit: string | null
  capacity_min: number | null
  capacity_max: number | null
  amenities: string[]
  status: 'draft' | 'published' | 'paused'
  media: MediaRow[] | null
  packages: PackageRow[] | null
  vendors:
    | { name: string; verified: boolean; rating: number; review_count: number }
    | { name: string; verified: boolean; rating: number; review_count: number }[]
    | null
}

const PLACEHOLDER: MediaItem = { id: 'ph', url: '', alt: '', order: 0 }

/** PostgREST returns embedded relations as arrays or objects; normalise to one. */
function firstOf<T>(v: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(v)) return v[0]
  return v ?? undefined
}

function mapPackage(p: PackageRow): Package {
  return {
    id: p.id,
    name: p.name,
    price: { minorUnits: p.price_minor, currency: 'INR', unit: p.price_unit ?? undefined },
    priceMode: 'fixed',
    inclusions: p.inclusions ?? [],
    active: p.active,
  }
}

function mapListing(r: ListingRow): Listing {
  const media = (r.media ?? []).slice().sort((a, b) => a.order - b.order)
  const items: MediaItem[] = media.map((m) => ({ id: m.id, url: m.url, alt: m.alt, order: m.order }))
  const vendor = firstOf(r.vendors)
  return {
    id: r.id,
    vendorId: r.vendor_id,
    vendorName: vendor?.name ?? 'Vendor',
    category: r.category,
    title: r.title,
    city: r.city,
    distanceKm: haversineKm(r.lat, r.lng),
    rating: vendor?.rating ?? 0,
    reviewCount: vendor?.review_count ?? 0,
    verified: vendor?.verified ?? false,
    priceMode: r.price_mode,
    fromPrice:
      r.from_price_minor != null
        ? { minorUnits: r.from_price_minor, currency: 'INR', unit: r.price_unit ?? undefined }
        : undefined,
    coverImage: items[0] ?? PLACEHOLDER,
    gallery: items.slice(1),
    amenities: r.amenities ?? [],
    capacityMin: r.capacity_min ?? undefined,
    capacityMax: r.capacity_max ?? undefined,
    status: r.status,
    description: r.description,
    packages: (r.packages ?? []).filter((p) => p.active).map(mapPackage),
  }
}

const LISTING_SELECT =
  '*, media(id,url,alt,order), packages(id,name,price_minor,currency,price_unit,inclusions,active), vendors(name,verified,rating,review_count)'

/* ------------------------------ listings -------------------------------- */

const listingRepo: ListingRepository = {
  async list(query: ListingQuery) {
    let q = sb().from('listings').select(LISTING_SELECT).eq('status', 'published').is('deleted_at', null)
    if (query.category) q = q.eq('category', query.category)
    if (query.city) q = q.ilike('city', query.city)
    const { data, error } = await q
    if (error) throw error
    let rows = (data as unknown as ListingRow[]).map(mapListing)

    if (query.verifiedOnly) rows = rows.filter((l) => l.verified)
    if (query.minRating) rows = rows.filter((l) => l.rating >= query.minRating!)
    if (query.maxDistanceKm) rows = rows.filter((l) => l.distanceKm <= query.maxDistanceKm!)
    if (query.minCapacity) rows = rows.filter((l) => (l.capacityMax ?? 0) >= query.minCapacity!)
    if (query.maxBudgetMinor)
      rows = rows.filter((l) => !l.fromPrice || l.fromPrice.minorUnits <= query.maxBudgetMinor!)
    if (query.q) {
      const s = query.q.toLowerCase()
      rows = rows.filter(
        (l) => l.title.toLowerCase().includes(s) || l.vendorName.toLowerCase().includes(s) || l.category.includes(s),
      )
    }
    switch (query.sort) {
      case 'rating': rows.sort((a, b) => b.rating - a.rating); break
      case 'distance': rows.sort((a, b) => a.distanceKm - b.distanceKm); break
      case 'price_low':
        rows.sort((a, b) => (a.fromPrice?.minorUnits ?? Infinity) - (b.fromPrice?.minorUnits ?? Infinity)); break
      default: rows.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    }
    return rows
  },

  async getById(id) {
    const { data, error } = await sb().from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapListing(data as unknown as ListingRow) : null
  },

  async reviewsFor(listingId) {
    const { data, error } = await sb()
      .from('reviews')
      .select('id,listing_id,author_id,rating,body,verified,created_at')
      .eq('listing_id', listingId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(
      (r): Review => ({
        id: r.id,
        listingId: r.listing_id,
        author: 'Verified couple',
        rating: r.rating,
        body: r.body,
        verified: r.verified,
        createdAt: r.created_at,
      }),
    )
  },
}

/* ----------------------------- favourites -------------------------------
 * Authenticated users sync to the server; guests fall back to localStorage
 * so a shortlist survives until they sign in (spec FAV-01: sync after auth).
 * ----------------------------------------------------------------------- */

const FAV_KEY = 'wm.favourites'
const readLocal = (): string[] => {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') } catch { return [] }
}
const writeLocal = (ids: string[]) => localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)]))

async function currentUserId(): Promise<string | null> {
  const { data } = await sb().auth.getUser()
  return data.user?.id ?? null
}

const favouriteRepo: FavouriteRepository = {
  async ids() {
    const uid = await currentUserId()
    if (!uid) return readLocal()
    const { data, error } = await sb().from('favourites').select('listing_id').eq('user_id', uid)
    if (error) throw error
    return (data ?? []).map((r) => r.listing_id)
  },
  async add(listingId) {
    const uid = await currentUserId()
    if (!uid) return writeLocal([...readLocal(), listingId])
    const { error } = await sb().from('favourites').upsert({ user_id: uid, listing_id: listingId })
    if (error) throw error
  },
  async remove(listingId) {
    const uid = await currentUserId()
    if (!uid) return writeLocal(readLocal().filter((x) => x !== listingId))
    const { error } = await sb().from('favourites').delete().eq('user_id', uid).eq('listing_id', listingId)
    if (error) throw error
  },
}

/* ------------------------------ enquiries -------------------------------- */

interface EnquiryRow {
  id: string
  listing_id: string
  vendor_id: string
  couple_id: string
  event_date: string | null
  guests: number | null
  budget_minor: number | null
  message: string
  stage: EnquiryStage
  created_at: string
}

async function titlesFor(listingIds: string[]): Promise<Record<string, { title: string; vendor: string }>> {
  if (listingIds.length === 0) return {}
  const { data } = await sb().from('listings').select('id,title,vendors(name)').in('id', listingIds)
  const map: Record<string, { title: string; vendor: string }> = {}
  for (const row of (data ?? []) as { id: string; title: string; vendors: { name: string } | { name: string }[] | null }[]) {
    map[row.id] = { title: row.title, vendor: firstOf(row.vendors)?.name ?? 'Vendor' }
  }
  return map
}

const enquiryRepo: EnquiryRepository = {
  async listForCouple() {
    const uid = await currentUserId()
    if (!uid) return []
    const { data, error } = await sb()
      .from('enquiries')
      .select('*')
      .eq('couple_id', uid)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as EnquiryRow[]
    const titles = await titlesFor(rows.map((r) => r.listing_id))
    return rows.map((r) => toEnquiry(r, titles, 'You'))
  },
  async listForVendor() {
    // Vendor leads are scoped by RLS to the caller's vendor memberships.
    const { data, error } = await sb().from('enquiries').select('*').order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as EnquiryRow[]
    const titles = await titlesFor(rows.map((r) => r.listing_id))
    return rows.map((r) => toEnquiry(r, titles, 'Couple'))
  },
  async create(input) {
    const uid = await currentUserId()
    if (!uid) throw new Error('Sign in to send an enquiry.')
    const listing = await listingRepo.getById(input.listingId)
    const { data, error } = await sb()
      .from('enquiries')
      .insert({
        couple_id: uid,
        listing_id: input.listingId,
        vendor_id: listing?.vendorId,
        message: input.message,
        event_date: input.eventDate ?? null,
        guests: input.guests ?? null,
        budget_minor: input.budgetMinor ?? null,
        idempotency_key: crypto.randomUUID(),
      })
      .select('*')
      .single()
    if (error) throw error
    const titles = await titlesFor([input.listingId])
    return toEnquiry(data as EnquiryRow, titles, 'You')
  },
  async setStage(id, stage) {
    const { data, error } = await sb().from('enquiries').update({ stage }).eq('id', id).select('*').single()
    if (error) throw error
    const titles = await titlesFor([(data as EnquiryRow).listing_id])
    return toEnquiry(data as EnquiryRow, titles, 'Couple')
  },
}

function toEnquiry(r: EnquiryRow, titles: Record<string, { title: string; vendor: string }>, coupleName: string): Enquiry {
  const t = titles[r.listing_id]
  return {
    id: r.id,
    listingId: r.listing_id,
    listingTitle: t?.title ?? 'Listing',
    vendorId: r.vendor_id,
    vendorName: t?.vendor ?? 'Vendor',
    coupleName,
    eventDate: r.event_date ?? undefined,
    guests: r.guests ?? undefined,
    budget: r.budget_minor != null ? { minorUnits: r.budget_minor, currency: 'INR' } : undefined,
    message: r.message,
    stage: r.stage,
    createdAt: r.created_at,
  }
}

/* ------------------------------- bookings -------------------------------- */

const bookingRepo: BookingRepository = {
  async listForCouple() {
    const uid = await currentUserId()
    if (!uid) return []
    const { data, error } = await sb().from('bookings').select('*').eq('couple_id', uid).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(
      (b): Booking => ({
        id: b.id,
        listingId: b.listing_id,
        listingTitle: b.package_name,
        vendorName: 'Vendor',
        eventDate: b.event_date,
        guests: b.guests,
        packageSnapshot: { name: b.package_name, price: { minorUnits: b.package_price_minor, currency: 'INR' } },
        status: b.status,
        createdAt: b.created_at,
      }),
    )
  },
}

/* --------------------------------- chat ---------------------------------- */

const chatRepo: ChatRepository = {
  async conversations() {
    const uid = await currentUserId()
    if (!uid) return []
    const { data, error } = await sb().from('conversations').select('*').order('last_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(
      (c): Conversation => ({
        id: c.id,
        listingId: c.listing_id ?? '',
        vendorName: 'Vendor',
        coupleName: 'You',
        lastMessage: c.last_message ?? '',
        lastAt: c.last_at ?? c.created_at,
        unread: 0,
      }),
    )
  },
  async messages(conversationId) {
    const { data, error } = await sb()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(
      (m): Message => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        body: m.body,
        attachmentUrl: m.attachment_url ?? undefined,
        attachmentType: m.attachment_type ?? undefined,
        state: m.state,
        createdAt: m.created_at,
      }),
    )
  },
}

/* ------------------------------- planner --------------------------------
 * Planner milestones are a per-user local concern until a planner table lands;
 * kept in localStorage so progress persists across sessions.
 * ----------------------------------------------------------------------- */

const PLANNER_KEY = 'wm.planner'
const DEFAULT_MILESTONES: PlannerMilestone[] = [
  { id: 'pm1', title: 'Set your wedding date', done: false, order: 0 },
  { id: 'pm2', title: 'Shortlist venues', done: false, order: 1 },
  { id: 'pm3', title: 'Book photographer', done: false, order: 2 },
  { id: 'pm4', title: 'Finalise catering menu', done: false, order: 3 },
  { id: 'pm5', title: 'Book makeup artist', done: false, order: 4 },
  { id: 'pm6', title: 'Confirm decor theme', done: false, order: 5 },
]
function readPlanner(): PlannerMilestone[] {
  try {
    const raw = localStorage.getItem(PLANNER_KEY)
    return raw ? (JSON.parse(raw) as PlannerMilestone[]) : DEFAULT_MILESTONES
  } catch {
    return DEFAULT_MILESTONES
  }
}
const plannerRepo: PlannerRepository = {
  async milestones() {
    return readPlanner()
  },
  async toggle(id) {
    const next = readPlanner().map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    localStorage.setItem(PLANNER_KEY, JSON.stringify(next))
    return next
  },
}

/* -------------------------------- vendor --------------------------------- */

const vendorRepo: VendorRepository = {
  async stats() {
    const leads = await enquiryRepo.listForVendor()
    return {
      newLeads: leads.filter((l) => l.stage === 'new').length,
      activeListings: 0,
      responseRatePct: 0,
      medianResponseMins: 0,
      upcomingBookings: 0,
      weeklyViews: [0, 0, 0, 0, 0, 0, 0],
      responseTargetMins: 10,
    }
  },
  async listings() {
    // RLS returns only listings the caller's vendor memberships own.
    const { data, error } = await sb().from('listings').select(LISTING_SELECT)
    if (error) throw error
    return (data as unknown as ListingRow[]).map(mapListing)
  },
}

/* ------------------------------- products -------------------------------- */

const productRepo: ProductRepository = {
  async list(category?: ProductCategory) {
    let q = sb().from('products').select('*').eq('active', true)
    if (category) q = q.eq('category', category)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []).map(
      (p): ProductItem => ({
        id: p.id,
        category: p.category,
        name: p.name,
        seller: p.seller,
        city: p.city,
        price: { minorUnits: p.price_minor, currency: 'INR', unit: p.price_unit ?? undefined },
        rating: p.rating,
        reviewCount: p.review_count,
        image: { id: p.id, url: p.image_url, alt: p.image_alt, order: 0 },
        description: p.description,
      }),
    )
  },
}

export const supabaseRepositories: Repositories = {
  listings: listingRepo,
  favourites: favouriteRepo,
  enquiries: enquiryRepo,
  bookings: bookingRepo,
  chat: chatRepo,
  planner: plannerRepo,
  vendor: vendorRepo,
  products: productRepo,
}
