import { getSupabase } from './supabase/client'
import { hasCapability } from './supabase/capabilities'

/**
 * Favourites / shortlist.
 *
 * Two layers, deliberately:
 *
 *  - The device store below is the one that always works. Browsing signed-out
 *    is the norm on this marketplace, so a shortlist has to survive without an
 *    account.
 *  - When the `shortlists` table exists (migration 0001) and someone is signed
 *    in, every change is also written to their account and the two are merged
 *    on sign-in, which is what makes the shortlist the same on Website, Android
 *    and iOS.
 *
 * The local write is never blocked on the network: the UI updates immediately
 * and the server copy catches up, so a flaky connection cannot lose a tap.
 */
const KEY = 'wm.favourites.v2'

/** Broadcast whenever the list changes underneath a mounted component. */
export const FAVOURITES_CHANGED_EVENT = 'wm:favourites-changed'

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]))
  } catch {
    /* storage full / private mode — shortlist is best-effort */
  }
}

export function getFavouriteIds(): string[] {
  return read()
}

export function isFavourite(id: string): boolean {
  return read().includes(id)
}

/** Returns the new full list so callers can update state in one step. */
export function toggleFavourite(id: string): string[] {
  const cur = read()
  const adding = !cur.includes(id)
  const next = adding ? [...cur, id] : cur.filter((x) => x !== id)
  write(next)
  void pushToAccount(id, adding)
  return next
}

export function clearFavourites(): void {
  write([])
}

/* ------------------------------------------------------- account sync */

/** Mirror one change to the account. Silent no-op when signed out or unmigrated. */
async function pushToAccount(vendorId: string, adding: boolean): Promise<void> {
  try {
    if (!(await hasCapability('shortlistSync'))) return
    const supabase = getSupabase()
    if (!supabase) return
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    if (adding) {
      await supabase
        .from('shortlists')
        .upsert({ user_id: auth.user.id, vendor_id: vendorId }, { onConflict: 'user_id,vendor_id' })
    } else {
      await supabase.from('shortlists').delete().eq('user_id', auth.user.id).eq('vendor_id', vendorId)
    }
  } catch {
    /* Offline or denied — the device copy is still correct and merges later. */
  }
}

/**
 * Reconcile device and account shortlists, and return the merged list.
 *
 * A union rather than a replace: someone who shortlisted three venues before
 * signing in should not lose them, and someone signing in on a new phone should
 * see what they saved elsewhere.
 */
export async function syncShortlist(): Promise<string[]> {
  const local = read()
  try {
    if (!(await hasCapability('shortlistSync'))) return local
    const supabase = getSupabase()
    if (!supabase) return local
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return local

    const { data, error } = await supabase
      .from('shortlists')
      .select('vendor_id')
      .eq('user_id', auth.user.id)
    if (error) return local

    const remote = ((data as { vendor_id: string }[]) ?? []).map((r) => r.vendor_id)
    const merged = [...new Set([...remote, ...local])]

    const missingRemotely = merged.filter((id) => !remote.includes(id))
    if (missingRemotely.length) {
      await supabase.from('shortlists').upsert(
        missingRemotely.map((vendor_id) => ({ user_id: auth.user!.id, vendor_id })),
        { onConflict: 'user_id,vendor_id' },
      )
    }

    write(merged)
    // Anything that came down from the account is new to this device, so tell
    // the mounted shortlist views rather than waiting for a remount.
    if (merged.length !== local.length) {
      window.dispatchEvent(new Event(FAVOURITES_CHANGED_EVENT))
    }
    return merged
  } catch {
    return local
  }
}
