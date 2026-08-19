import { requireSupabase, ServiceError, toServiceError } from './supabase/client'
import { hasCapability } from './supabase/capabilities'

/**
 * In-app notifications.
 *
 * Rows are written by database triggers (migrations 0001 and 0002), not by the
 * client, so an alert exists because the event happened — not because a screen
 * happened to be open when it did. Both sides read the same table: RLS scopes a
 * customer to `user_id = auth.uid()` and a vendor to their own listing.
 *
 * Push delivery (FCM / APNs) is a separate, credential-dependent step and is
 * deliberately not faked here; see docs/DEPLOYMENT.md.
 */
export type NotificationKind =
  | 'enquiry_received'
  | 'vendor_replied'
  | 'booking_status_changed'
  | 'booking_confirmed'
  | 'message_received'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

interface Row {
  id: string
  kind: NotificationKind
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const COLS = 'id,kind,title,body,link,read_at,created_at'

const map = (r: Row): AppNotification => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body,
  link: r.link,
  readAt: r.read_at,
  createdAt: r.created_at,
})

/**
 * Everything addressed to the signed-in identity, newest first.
 *
 * No `user_id` / `vendor_id` filter is needed — and none would be safe to trust
 * anyway. The RLS policy already limits the result to rows that belong to this
 * session, whether it is a couple's account or a vendor's.
 */
export async function listNotifications(limit = 30): Promise<AppNotification[]> {
  if (!(await hasCapability('notifications'))) {
    throw new ServiceError(
      'Notifications need the marketplace schema migration to be applied to this Supabase project.',
      'unsupported',
    )
  }
  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []
    const { data, error } = await supabase
      .from('notifications')
      .select(COLS)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as unknown as Row[]).map(map)
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Unread count for the bell. Returns 0 rather than throwing: it is a badge. */
export async function unreadNotificationCount(): Promise<number> {
  try {
    if (!(await hasCapability('notifications'))) return 0
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return 0
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { head: true, count: 'exact' })
      .is('read_at', null)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!(await hasCapability('notifications'))) return
  try {
    const supabase = requireSupabase()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null)
    if (error) throw error
  } catch (err) {
    throw toServiceError(err)
  }
}

/** "Mark all read" — one round trip, scoped by RLS to this identity's rows. */
export async function markAllNotificationsRead(): Promise<void> {
  if (!(await hasCapability('notifications'))) return
  try {
    const supabase = requireSupabase()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
    if (error) throw error
  } catch (err) {
    throw toServiceError(err)
  }
}
