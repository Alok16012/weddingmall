/**
 * Domain types — conceptual data contracts from spec §9.
 * These mirror the intended Supabase schema. The repository layer maps rows
 * to these types so UI never depends on raw table shapes.
 */

export type Role = 'couple' | 'vendor'

export type VendorCategory =
  | 'venue'
  | 'makeup'
  | 'photography'
  | 'catering'
  | 'decor'
  | 'mehendi'

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: 'Venues',
  makeup: 'Makeup',
  photography: 'Photography',
  catering: 'Catering',
  decor: 'Decor',
  mehendi: 'Mehendi',
}

export type ApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'

export type ListingStatus = 'draft' | 'published' | 'paused'

export type PriceMode = 'fixed' | 'on_request'

export interface Money {
  /** Integer minor units (paise). */
  minorUnits: number
  currency: 'INR'
  /** e.g. "per plate", "per event", "per day". */
  unit?: string
}

export interface Profile {
  id: string
  role: Role
  displayName: string
  phone?: string
  city?: string
  avatarUrl?: string
  weddingDate?: string
}

export interface Vendor {
  id: string
  name: string
  category: VendorCategory
  verified: boolean
  approval: ApprovalStatus
  city: string
  rating: number
  reviewCount: number
}

export interface MediaItem {
  id: string
  url: string
  alt: string
  order: number
}

export interface Package {
  id: string
  name: string
  price: Money
  priceMode: PriceMode
  inclusions: string[]
  active: boolean
}

export interface Listing {
  id: string
  vendorId: string
  vendorName: string
  category: VendorCategory
  title: string
  city: string
  /** Distance from the user in km, derived from server coordinates. */
  distanceKm: number
  rating: number
  reviewCount: number
  verified: boolean
  priceMode: PriceMode
  fromPrice?: Money
  coverImage: MediaItem
  gallery: MediaItem[]
  amenities: string[]
  capacityMin?: number
  capacityMax?: number
  status: ListingStatus
  description: string
}

export type EnquiryStage =
  | 'new'
  | 'contacted'
  | 'quoted'
  | 'visit_scheduled'
  | 'won'
  | 'lost'

export interface Enquiry {
  id: string
  listingId: string
  listingTitle: string
  vendorId: string
  vendorName: string
  coupleName: string
  eventDate?: string
  guests?: number
  budget?: Money
  message: string
  stage: EnquiryStage
  createdAt: string
  slaDueAt?: string
}

export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'declined'
  | 'completed'
  | 'cancelled'

export interface Booking {
  id: string
  listingId: string
  listingTitle: string
  vendorName: string
  eventDate: string
  guests: number
  packageSnapshot: { name: string; price: Money }
  status: BookingStatus
  createdAt: string
}

export type MessageState = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  attachmentUrl?: string
  attachmentType?: 'image' | 'pdf'
  state: MessageState
  createdAt: string
}

export interface Conversation {
  id: string
  listingId: string
  vendorName: string
  coupleName: string
  lastMessage: string
  lastAt: string
  unread: number
}

export interface PlannerMilestone {
  id: string
  title: string
  done: boolean
  order: number
}

export interface Review {
  id: string
  listingId: string
  author: string
  rating: number
  body: string
  verified: boolean
  createdAt: string
}
