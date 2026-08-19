import type { AvailabilityDay, AvailabilityStatus, Booking, BookingStatus } from '@/types/domain'
import { requireSupabase, ServiceError, toServiceError } from './supabase/client'
import { hasCapability } from './supabase/capabilities'

/**
 * Bookings and vendor date availability.
 *
 * Both live in tables created by `supabase/migrations/0001_marketplace_workflows.sql`.
 * Until that runs, every call here reports `unsupported` and the screens above
 * say so plainly — no local stand-in, no invented rows.
 */

interface BookingRow {
  id: string
  reference: string
  vendor_id: string
  vendor_name: string | null
  event_date: string | null
  event_type: string | null
  guest_count: number | null
  status: BookingStatus
  payment_state: string | null
  contact_name: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string | null
}

function mapBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    reference: r.reference,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    eventDate: r.event_date,
    eventType: r.event_type,
    guestCount: r.guest_count,
    status: r.status,
    paymentState: r.payment_state,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

const BOOKING_COLS =
  'id,reference,vendor_id,vendor_name,event_date,event_type,guest_count,status,payment_state,contact_name,contact_phone,created_at,updated_at'

function unsupported(feature: string): never {
  throw new ServiceError(
    `${feature} needs the marketplace schema migration to be applied to this Supabase project.`,
    'unsupported',
  )
}

/** The signed-in customer's bookings, newest first. */
export async function listMyBookings(): Promise<Booking[]> {
  if (!(await hasCapability('bookings'))) unsupported('My Bookings')
  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_COLS)
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as unknown as BookingRow[]).map(mapBooking)
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Bookings against the vendor's own listing — the dashboard's upcoming list. */
export async function listVendorBookings(vendorId: string): Promise<Booking[]> {
  if (!(await hasCapability('bookings'))) unsupported('Bookings')
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_COLS)
      .eq('vendor_id', vendorId)
      .order('event_date', { ascending: true, nullsFirst: false })
    if (error) throw error
    return (data as unknown as BookingRow[]).map(mapBooking)
  } catch (err) {
    throw toServiceError(err)
  }
}

/**
 * Open a booking record for an enquiry the user just sent.
 *
 * It enters at `enquiry_sent` and nothing here can move it further — only the
 * vendor advances the status, so an enquiry is never shown as a confirmed
 * booking.
 */
export async function createBookingFromEnquiry(input: {
  vendorId: string
  vendorName?: string | null
  eventDate?: string | null
  eventType?: string | null
  guestCount?: number | null
  contactName?: string | null
  contactPhone?: string | null
}): Promise<Booking | null> {
  if (!(await hasCapability('bookings'))) return null
  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    // Bookings belong to an account. A guest enquiry is still delivered to the
    // vendor through `leads`; it just has no personal history to appear in.
    if (!auth.user) return null

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: auth.user.id,
        vendor_id: input.vendorId,
        vendor_name: input.vendorName ?? null,
        event_date: input.eventDate || null,
        event_type: input.eventType || null,
        guest_count: input.guestCount ?? null,
        contact_name: input.contactName ?? null,
        contact_phone: input.contactPhone ?? null,
        status: 'enquiry_sent',
      })
      .select(BOOKING_COLS)
      .maybeSingle()
    if (error) throw error
    return data ? mapBooking(data as unknown as BookingRow) : null
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Vendor-side status change. RLS restricts this to the owning vendor. */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (!(await hasCapability('bookings'))) unsupported('Booking status')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toServiceError(err)
  }
}

/* ------------------------------------------------------------ availability */

interface AvailabilityRow {
  id: string
  vendor_id: string
  date: string
  status: AvailabilityStatus
  note: string | null
}

const mapDay = (r: AvailabilityRow): AvailabilityDay => ({
  id: r.id,
  vendorId: r.vendor_id,
  date: r.date,
  status: r.status,
  note: r.note,
})

/** Every marked date for a vendor between two ISO dates (inclusive). */
export async function listAvailability(
  vendorId: string,
  from: string,
  to: string,
): Promise<AvailabilityDay[]> {
  if (!(await hasCapability('availability'))) unsupported('Manage Booking Date')
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('vendor_availability')
      .select('id,vendor_id,date,status,note')
      .eq('vendor_id', vendorId)
      .gte('date', from)
      .lte('date', to)
      .order('date')
    if (error) throw error
    return (data as unknown as AvailabilityRow[]).map(mapDay)
  } catch (err) {
    throw toServiceError(err)
  }
}

/**
 * Set the state of one date. The `(vendor_id, date)` unique constraint makes
 * this an upsert, which is also what stops the same day being double-booked.
 */
export async function setAvailability(
  vendorId: string,
  date: string,
  status: AvailabilityStatus,
  note?: string,
): Promise<void> {
  if (!(await hasCapability('availability'))) unsupported('Manage Booking Date')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase
      .from('vendor_availability')
      .upsert(
        { vendor_id: vendorId, date, status, note: note ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'vendor_id,date' },
      )
    if (error) throw error
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Mark an inclusive range in one round trip — "block these dates". */
export async function setAvailabilityRange(
  vendorId: string,
  from: string,
  to: string,
  status: AvailabilityStatus,
  note?: string,
): Promise<void> {
  if (!(await hasCapability('availability'))) unsupported('Manage Booking Date')
  const rows: Record<string, unknown>[] = []
  for (const date of datesBetween(from, to)) {
    rows.push({ vendor_id: vendorId, date, status, note: note ?? null, updated_at: new Date().toISOString() })
  }
  if (!rows.length) return
  try {
    const supabase = requireSupabase()
    const { error } = await supabase
      .from('vendor_availability')
      .upsert(rows, { onConflict: 'vendor_id,date' })
    if (error) throw error
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Inclusive list of ISO dates. Capped so a typo cannot generate a huge write. */
export function datesBetween(from: string, to: string, limit = 366): string[] {
  const out: string[] = []
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  if (Number.isNaN(+start) || Number.isNaN(+end) || end < start) return out
  for (const d = start; d <= end && out.length < limit; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
