import type {
  Booking,
  Conversation,
  Enquiry,
  Listing,
  Message,
  PlannerMilestone,
  Review,
  VendorCategory,
} from '@/types/domain'

export interface ListingQuery {
  q?: string
  category?: VendorCategory
  city?: string
  maxDistanceKm?: number
  minRating?: number
  verifiedOnly?: boolean
  minCapacity?: number
  maxBudgetMinor?: number
  sort?: 'recommended' | 'rating' | 'distance' | 'price_low'
}

/** All UI data access flows through these interfaces — never raw tables. */
export interface ListingRepository {
  list(query: ListingQuery): Promise<Listing[]>
  getById(id: string): Promise<Listing | null>
  reviewsFor(listingId: string): Promise<Review[]>
}

export interface FavouriteRepository {
  ids(): Promise<string[]>
  add(listingId: string): Promise<void>
  remove(listingId: string): Promise<void>
}

export interface EnquiryRepository {
  listForCouple(): Promise<Enquiry[]>
  listForVendor(): Promise<Enquiry[]>
  create(input: {
    listingId: string
    message: string
    eventDate?: string
    guests?: number
    budgetMinor?: number
  }): Promise<Enquiry>
  setStage(id: string, stage: Enquiry['stage']): Promise<Enquiry>
}

export interface BookingRepository {
  listForCouple(): Promise<Booking[]>
}

export interface ChatRepository {
  conversations(): Promise<Conversation[]>
  messages(conversationId: string): Promise<Message[]>
}

export interface PlannerRepository {
  milestones(): Promise<PlannerMilestone[]>
  toggle(id: string): Promise<PlannerMilestone[]>
}

export interface VendorDashboardStats {
  newLeads: number
  activeListings: number
  responseRatePct: number
  medianResponseMins: number
  upcomingBookings: number
}

export interface VendorRepository {
  stats(): Promise<VendorDashboardStats>
  listings(): Promise<Listing[]>
}

export interface Repositories {
  listings: ListingRepository
  favourites: FavouriteRepository
  enquiries: EnquiryRepository
  bookings: BookingRepository
  chat: ChatRepository
  planner: PlannerRepository
  vendor: VendorRepository
}
