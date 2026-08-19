import type { Lead, NewLead } from '@/types/domain'
import { requireSupabase, ServiceError, toServiceError } from './supabase/client'
import { hasCapability } from './supabase/capabilities'
import { platformName } from '@/lib/analytics'

interface LeadRow {
  id: string
  vendor_id: string
  vendor_name: string | null
  customer_name: string
  customer_phone: string
  wedding_date: string | null
  type: string | null
  status: string | null
  created_at: string
  customer_email?: string | null
  event_type?: string | null
  guest_count?: number | null
  city?: string | null
  message?: string | null
}

function mapLead(r: LeadRow): Lead {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    weddingDate: r.wedding_date,
    type: r.type,
    status: r.status,
    createdAt: r.created_at,
    customerEmail: r.customer_email ?? null,
    eventType: r.event_type ?? null,
    guestCount: r.guest_count ?? null,
    city: r.city ?? null,
    message: r.message ?? null,
  }
}

/** 10-digit Indian mobile, optionally with +91 / 0 prefix. */
export function isValidIndianMobile(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').replace(/^(?:91|0)/, ''))
}

export function normaliseMobile(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^(?:91|0)/, '')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/**
 * Create an enquiry. Writes to the SAME `leads` table the website uses, so the
 * vendor sees app enquiries and website enquiries in one place.
 *
 * The detail fields (email, event type, guests, city, message) are only sent
 * when the backend has the columns for them — migration 0001 adds those. The
 * composer collects them under the same condition, so nothing a user types is
 * ever silently discarded.
 *
 * Note: `leads` accepts anonymous inserts by design (matching the website's public
 * enquiry form). See docs/SECURITY.md for the recommended anti-spam hardening.
 */
export async function createLead(input: NewLead): Promise<Lead> {
  const name = input.customerName.trim()
  const phone = normaliseMobile(input.customerPhone)

  if (name.length < 2) throw new ServiceError('Please enter your name.', 'validation')
  if (!isValidIndianMobile(phone))
    throw new ServiceError('Enter a valid 10-digit mobile number.', 'validation')
  if (input.weddingDate && input.weddingDate < new Date().toISOString().slice(0, 10))
    throw new ServiceError('Choose a future wedding date.', 'validation')
  if (input.customerEmail && !isValidEmail(input.customerEmail))
    throw new ServiceError('Enter a valid email address, or leave it blank.', 'validation')
  if (input.guestCount !== undefined && (input.guestCount <= 0 || input.guestCount > 100000))
    throw new ServiceError('Enter a realistic number of guests.', 'validation')

  try {
    const supabase = requireSupabase()
    const row: Record<string, unknown> = {
      vendor_id: input.vendorId,
      vendor_name: input.vendorName ?? null,
      customer_name: name,
      customer_phone: phone,
      wedding_date: input.weddingDate || null,
      type: input.type ?? 'app',
      status: 'new',
    }

    if (await hasCapability('leadDetails')) {
      row.customer_email = input.customerEmail?.trim() || null
      row.event_type = input.eventType || null
      row.guest_count = input.guestCount ?? null
      row.city = input.city?.trim() || null
      row.message = input.message?.trim() || null
      row.platform = platformName()
      const { data: auth } = await supabase.auth.getUser()
      if (auth.user) row.user_id = auth.user.id
    }

    // NOTE: no `.select()` here. RLS correctly denies anonymous SELECT on `leads`
    // (verified live), so asking PostgREST to return the inserted row would fail
    // the whole request with a permission error even though the INSERT succeeds.
    const { error } = await supabase.from('leads').insert(row)
    if (error) throw error

    // Echo back what we wrote; the server-assigned id isn't needed by the UI.
    return mapLead({
      id: '',
      created_at: new Date().toISOString(),
      ...row,
    } as LeadRow)
  } catch (err) {
    throw toServiceError(err)
  }
}

/**
 * Leads for the signed-in vendor. RLS restricts visibility — an anonymous
 * client reads zero rows (verified live), so this only returns data when the
 * vendor's session is authorised for them.
 */
export async function listLeadsForVendor(vendorId: string): Promise<Lead[]> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as LeadRow[]).map(mapLead)
  } catch (err) {
    throw toServiceError(err)
  }
}

/**
 * The signed-in customer's own enquiries, newest first.
 *
 * Requires migration 0001: it adds `leads.user_id` and the RLS policy that lets
 * a user read the rows they created. Without it PostgREST has no column to
 * filter on, so this reports the capability as missing rather than guessing.
 */
export async function listMyLeads(): Promise<Lead[]> {
  if (!(await hasCapability('leadDetails')))
    throw new ServiceError('Enquiry history is not enabled on this backend yet.', 'unsupported')
  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as LeadRow[]).map(mapLead)
  } catch (err) {
    throw toServiceError(err)
  }
}
