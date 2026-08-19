import type { NewReview, Review } from '@/types/domain'
import { requireSupabase, ServiceError, toServiceError } from './supabase/client'
import { hasCapability } from './supabase/capabilities'

/**
 * Reviews.
 *
 * Submissions land as `pending` and a moderator publishes them — the schema's
 * own answer to the spam / fake-review requirement. A `unique (user_id,
 * vendor_id)` constraint handles duplicates, and a trigger stamps
 * `verified_booking` when a completed booking backs the review.
 */

interface ReviewRow {
  id: string
  vendor_id: string
  vendor_name: string | null
  rating: number
  title: string | null
  body: string | null
  service_used: string | null
  event_date: string | null
  photos: string[] | null
  verified_booking: boolean
  status: 'pending' | 'published' | 'rejected'
  created_at: string
}

const COLS =
  'id,vendor_id,vendor_name,rating,title,body,service_used,event_date,photos,verified_booking,status,created_at'

function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    serviceUsed: r.service_used,
    eventDate: r.event_date,
    photos: r.photos ?? [],
    verifiedBooking: r.verified_booking,
    status: r.status,
    createdAt: r.created_at,
  }
}

function unsupported(): never {
  throw new ServiceError(
    'Reviews need the marketplace schema migration to be applied to this Supabase project.',
    'unsupported',
  )
}

/** Published reviews for a listing. */
export async function listVendorReviews(vendorId: string): Promise<Review[]> {
  if (!(await hasCapability('reviews'))) return []
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('reviews')
      .select(COLS)
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as unknown as ReviewRow[]).map(mapReview)
  } catch (err) {
    throw toServiceError(err)
  }
}

export async function submitReview(input: NewReview): Promise<Review> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    throw new ServiceError('Choose a rating from 1 to 5 stars.', 'validation')
  if (input.body && input.body.trim().length < 20)
    throw new ServiceError('Please write at least a couple of sentences.', 'validation')
  if (!(await hasCapability('reviews'))) unsupported()

  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user)
      throw new ServiceError('Please sign in before writing a review.', 'denied')

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: auth.user.id,
        vendor_id: input.vendorId,
        vendor_name: input.vendorName ?? null,
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
        service_used: input.serviceUsed || null,
        event_date: input.eventDate || null,
      })
      .select(COLS)
      .single()
    if (error) {
      // 23505 = the one-review-per-vendor unique constraint.
      if ((error as { code?: string }).code === '23505')
        throw new ServiceError('You have already reviewed this listing.', 'validation')
      throw error
    }
    return mapReview(data as unknown as ReviewRow)
  } catch (err) {
    throw toServiceError(err)
  }
}
