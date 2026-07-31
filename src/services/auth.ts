import { requireSupabase, ServiceError, toServiceError } from './supabase/client'

/**
 * Auth for this backend.
 *
 * The production project has `email: true` and `phone: false` (verified via
 * /auth/v1/settings), and every existing user is a vendor email account
 * (e.g. contact@cdsresort.com). So:
 *   - Customers browse as GUESTS (no account) and submit enquiries to `leads`,
 *     exactly like the website's public enquiry form.
 *   - Vendors sign in with email + password to see their own leads.
 */

export async function signInWithEmail(email: string, password: string): Promise<void> {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ServiceError('Enter a valid email.', 'validation')
  if (!password) throw new ServiceError('Enter your password.', 'validation')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (/invalid login credentials/i.test(error.message))
        throw new ServiceError('Incorrect email or password.', 'denied')
      throw error
    }
  } catch (err) {
    throw err instanceof ServiceError ? err : toServiceError(err)
  }
}

/** Sends a reset link; the app handles the deep link on return. */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ServiceError('Enter a valid email.', 'validation')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) throw error
  } catch (err) {
    throw err instanceof ServiceError ? err : toServiceError(err)
  }
}

/** Completes the reset flow once the recovery session is active. */
export async function updatePassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8)
    throw new ServiceError('Password must be at least 8 characters.', 'validation')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  } catch (err) {
    throw err instanceof ServiceError ? err : toServiceError(err)
  }
}

export async function signOut(): Promise<void> {
  const supabase = requireSupabase()
  await supabase.auth.signOut()
}
