import { getSupabase } from './client'

/**
 * Which optional parts of the schema this backend actually has.
 *
 * The live production database currently exposes `vendors`, `leads` and `blogs`
 * and nothing else. The migrations in `supabase/migrations/` add the tables and
 * columns the newer features need, but they have to be run by someone holding
 * the project's own credentials — the app ships with the public anon key only.
 *
 * Rather than render buttons that would fail, or fill them with invented data,
 * every feature that depends on a migration asks here first and simply does not
 * appear until the backend can genuinely serve it. One narrow single-row read per
 * capability per session answers the question; PostgREST replies 400 with
 * `42703`/`PGRST204` for a missing column and 404 with `PGRST205` for a missing
 * table.
 *
 * The probe deliberately does NOT use `head: true`. A HEAD response carries no
 * body, so PostgREST's error code never reaches the client — a missing table came
 * back as a bare 204 and a missing column as a 400 with an empty message, and both
 * were read as "present". That is how the whole catalogue once went blank: the
 * vendor list believed `vendors.phone` existed and every listing query 400'd.
 */
export type Capability =
  /** `vendors.phone` / `vendors.whatsapp` — direct call and WhatsApp actions. */
  | 'vendorContact'
  /** The wider enquiry form: email, event type, guests, city, message. */
  | 'leadDetails'
  /** `bookings` — My Bookings and the vendor's date management. */
  | 'bookings'
  /** `reviews` — Write a Review. */
  | 'reviews'
  /** `messages` — Inbox threads. */
  | 'messages'
  /** `shortlists` — shortlist synced across devices instead of per-device. */
  | 'shortlistSync'
  /** `vendor_availability` — the vendor calendar behind Manage Booking Date. */
  | 'availability'
  /** `notifications` — the in-app alert list and its unread badge. */
  | 'notifications'

/** table + one column that only exists once the migration has run. */
const PROBES: Record<Capability, { table: string; column: string }> = {
  vendorContact: { table: 'vendors', column: 'phone' },
  leadDetails: { table: 'leads', column: 'message' },
  bookings: { table: 'bookings', column: 'id' },
  reviews: { table: 'reviews', column: 'id' },
  messages: { table: 'messages', column: 'id' },
  shortlistSync: { table: 'shortlists', column: 'id' },
  availability: { table: 'vendor_availability', column: 'id' },
  notifications: { table: 'notifications', column: 'id' },
}

// v2: the v1 probe answered with false positives, so any cached v1 verdict has
// to be discarded rather than trusted.
const STORAGE_KEY = 'wm.capabilities.v2'
const inflight = new Map<Capability, Promise<boolean>>()

/** Session-scoped memo, so a reload does not re-probe seven endpoints. */
function readCache(): Partial<Record<Capability, boolean>> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<
      Record<Capability, boolean>
    >
  } catch {
    return {}
  }
}

function writeCache(cap: Capability, value: boolean) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readCache(), [cap]: value }))
  } catch {
    /* Private mode / storage disabled — the in-memory map still holds. */
  }
}

/**
 * True when the backend can genuinely serve this feature.
 *
 * A denied read (RLS) still means the relation exists, so it counts as present:
 * the feature is reachable once the user is authorised, which is a different
 * problem from the table not being there at all.
 */
export async function hasCapability(cap: Capability): Promise<boolean> {
  const cached = readCache()[cap]
  if (cached !== undefined) return cached

  const running = inflight.get(cap)
  if (running) return running

  const probe = (async () => {
    const supabase = getSupabase()
    if (!supabase) return false
    const { table, column } = PROBES[cap]
    const { error } = await supabase.from(table).select(column).limit(1)
    // 42703 = undefined column, PGRST204 = unknown column in schema cache,
    // PGRST205 / 42P01 = relation not exposed. Anything else (including 42501,
    // "permission denied") means the schema is there.
    const missing =
      !!error && /42P01|42703|PGRST20[45]|PGRST106|does not exist|Not Found/i.test(
        `${error.code ?? ''} ${error.message ?? ''}`,
      )
    return !missing
  })()
    .catch(() => false)
    .then((ok) => {
      writeCache(cap, ok)
      inflight.delete(cap)
      return ok
    })

  inflight.set(cap, probe)
  return probe
}
