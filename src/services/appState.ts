import { getSupabase } from './supabase/client'

/**
 * Per-user app state that has to survive a reinstall — currently just whether
 * the onboarding tour has been completed.
 *
 * Device-local first so a signed-out first-timer is never shown the tour twice,
 * with the account copy (from migration 0001) layered on top so a returning
 * user is not re-onboarded on a second device. Reads take the optimistic union:
 * completed anywhere means completed.
 */
const ONBOARDING_KEY = 'wm.onboarding.v1'

export function isOnboardingCompleteLocally(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'done'
  } catch {
    return false
  }
}

function markLocally() {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'done')
  } catch {
    /* Private mode — the tour reappears next session, which is acceptable. */
  }
}

/**
 * Has this person finished the tour, on this device or any other?
 *
 * The remote lookup is skipped entirely when the local flag is already set, so
 * the common case costs nothing and app startup is never blocked on it.
 */
export async function isOnboardingComplete(): Promise<boolean> {
  if (isOnboardingCompleteLocally()) return true
  try {
    const supabase = getSupabase()
    if (!supabase) return false
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return false

    const { data, error } = await supabase
      .from('user_app_state')
      .select('onboarding_completed')
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (error || !data) return false

    const done = !!(data as { onboarding_completed: boolean }).onboarding_completed
    if (done) markLocally()
    return done
  } catch {
    // No `user_app_state` table yet: local state alone decides.
    return false
  }
}

/** Record completion locally, and on the account when one is signed in. */
export async function completeOnboarding(): Promise<void> {
  markLocally()
  try {
    const supabase = getSupabase()
    if (!supabase) return
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    await supabase.from('user_app_state').upsert(
      {
        user_id: auth.user.id,
        onboarding_completed: true,
        onboarding_version: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  } catch {
    /* Unmigrated backend or offline — the device flag still holds. */
  }
}

/** Broadcast so a mounted tour restarts without a page reload. */
export const ONBOARDING_RESET_EVENT = 'wm:onboarding-reset'

/** Used by the "Replay app tour" action in More. */
export function resetOnboardingLocally() {
  try {
    localStorage.removeItem(ONBOARDING_KEY)
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new Event(ONBOARDING_RESET_EVENT))
}
