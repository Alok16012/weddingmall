import type { Enquiry, PlannerMilestone } from '@/types/domain'
import * as fx from './fixtures'
import type {
  BookingRepository,
  ChatRepository,
  EnquiryRepository,
  FavouriteRepository,
  ListingQuery,
  ListingRepository,
  PlannerRepository,
  Repositories,
  VendorRepository,
} from './types'

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))

const FAV_KEY = 'wm.favourites'
function readFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeFavs(ids: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)]))
}

const listingRepo: ListingRepository = {
  async list(query: ListingQuery) {
    await delay()
    let rows = fx.listings.filter((l) => l.status === 'published')
    if (query.category) rows = rows.filter((l) => l.category === query.category)
    if (query.city) rows = rows.filter((l) => l.city.toLowerCase() === query.city!.toLowerCase())
    if (query.verifiedOnly) rows = rows.filter((l) => l.verified)
    if (query.minRating) rows = rows.filter((l) => l.rating >= query.minRating!)
    if (query.maxDistanceKm) rows = rows.filter((l) => l.distanceKm <= query.maxDistanceKm!)
    if (query.minCapacity) rows = rows.filter((l) => (l.capacityMax ?? 0) >= query.minCapacity!)
    if (query.maxBudgetMinor)
      rows = rows.filter((l) => !l.fromPrice || l.fromPrice.minorUnits <= query.maxBudgetMinor!)
    if (query.q) {
      const q = query.q.toLowerCase()
      rows = rows.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.vendorName.toLowerCase().includes(q) ||
          l.category.includes(q),
      )
    }
    switch (query.sort) {
      case 'rating':
        rows = [...rows].sort((a, b) => b.rating - a.rating)
        break
      case 'distance':
        rows = [...rows].sort((a, b) => a.distanceKm - b.distanceKm)
        break
      case 'price_low':
        rows = [...rows].sort(
          (a, b) => (a.fromPrice?.minorUnits ?? Infinity) - (b.fromPrice?.minorUnits ?? Infinity),
        )
        break
      default:
        rows = [...rows].sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    }
    return rows
  },
  async getById(id) {
    await delay(160)
    return fx.listings.find((l) => l.id === id) ?? null
  },
  async reviewsFor(listingId) {
    await delay(160)
    return fx.reviews[listingId] ?? []
  },
}

const favouriteRepo: FavouriteRepository = {
  async ids() {
    await delay(80)
    return readFavs()
  },
  async add(listingId) {
    await delay(120)
    writeFavs([...readFavs(), listingId])
  },
  async remove(listingId) {
    await delay(120)
    writeFavs(readFavs().filter((id) => id !== listingId))
  },
}

let coupleEnquiries = [...fx.enquiriesCouple]
let vendorLeads = [...fx.enquiriesVendor]

const enquiryRepo: EnquiryRepository = {
  async listForCouple() {
    await delay()
    return coupleEnquiries
  },
  async listForVendor() {
    await delay()
    return vendorLeads
  },
  async create(input) {
    await delay(260)
    const listing = fx.listings.find((l) => l.id === input.listingId)
    const created: Enquiry = {
      id: `enq_${Date.now()}`,
      listingId: input.listingId,
      listingTitle: listing?.title ?? 'Listing',
      vendorId: listing?.vendorId ?? 'ven',
      vendorName: listing?.vendorName ?? 'Vendor',
      coupleName: 'You',
      eventDate: input.eventDate,
      guests: input.guests,
      budget: input.budgetMinor ? { minorUnits: input.budgetMinor, currency: 'INR' } : undefined,
      message: input.message,
      stage: 'new',
      createdAt: new Date().toISOString(),
    }
    coupleEnquiries = [created, ...coupleEnquiries]
    return created
  },
  async setStage(id, stage) {
    await delay(160)
    vendorLeads = vendorLeads.map((l) => (l.id === id ? { ...l, stage } : l))
    const found = vendorLeads.find((l) => l.id === id)!
    return found
  },
}

const bookingRepo: BookingRepository = {
  async listForCouple() {
    await delay()
    return fx.bookingsCouple
  },
}

const chatRepo: ChatRepository = {
  async conversations() {
    await delay()
    return fx.conversations
  },
  async messages(conversationId) {
    await delay(160)
    return fx.messages[conversationId] ?? []
  },
}

let milestones: PlannerMilestone[] = [...fx.plannerMilestones]
const plannerRepo: PlannerRepository = {
  async milestones() {
    await delay(120)
    return milestones
  },
  async toggle(id) {
    await delay(80)
    milestones = milestones.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    return milestones
  },
}

const vendorRepo: VendorRepository = {
  async stats() {
    await delay()
    return {
      newLeads: vendorLeads.filter((l) => l.stage === 'new').length,
      activeListings: fx.listings.filter((l) => l.vendorId === 'ven_usha' && l.status === 'published').length,
      responseRatePct: 92,
      medianResponseMins: 8,
      upcomingBookings: 3,
    }
  },
  async listings() {
    await delay()
    return fx.listings.filter((l) => l.vendorId === 'ven_usha')
  },
}

export const fixtureRepositories: Repositories = {
  listings: listingRepo,
  favourites: favouriteRepo,
  enquiries: enquiryRepo,
  bookings: bookingRepo,
  chat: chatRepo,
  planner: plannerRepo,
  vendor: vendorRepo,
}
