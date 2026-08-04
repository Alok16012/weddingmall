import { requireSupabase, ServiceError, toServiceError } from './supabase/client'
import { isValidIndianMobile, normaliseMobile } from './leads'

/**
 * Auth for this backend.
 *
 * The production project has `email: true` and `phone: false` (verified via
 * /auth/v1/settings), and every existing user is a vendor email account
 * (e.g. contact@cdsresort.com). So:
 *   - Customers browse as GUESTS (no account) and submit enquiries to `leads`,
 *     exactly like the website's public enquiry form.
 *   - Vendors sign in with email + password to see their own leads.
 *
 * Guest mobile verification (below) is written against Supabase's SMS OTP, but
 * SMS is only delivered once the project owner enables and pays for a phone
 * provider. Until then every send fails with `unsupported`, and the UI lets the
 * guest carry on unverified instead of locking them out of the app.
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

/* ---------------------------------------------------------------- mobile OTP */

export const OTP_LENGTH = 6

/** Supabase wants E.164; the rest of the app carries bare 10-digit numbers. */
function toE164(mobile: string): string {
  return `+91${normaliseMobile(mobile)}`
}

/**
 * Collapse the several shapes Supabase uses for "this project has no SMS
 * provider" into one code the screens can branch on. Which shape comes back
 * depends on the GoTrue version, so matching only `error_code` is not enough.
 */
function toOtpError(err: unknown): ServiceError {
  if (err instanceof ServiceError) return err
  const e = err as { message?: string; code?: string; status?: number } | null
  const msg = e?.message ?? ''
  if (
    e?.code === 'phone_provider_disabled' ||
    e?.code === 'otp_disabled' ||
    /phone[_ ]provider|unsupported phone|phone (?:auth|sign[- ]?ups?|logins?)|signups? not allowed/i.test(
      msg,
    )
  )
    return new ServiceError('Mobile verification isn’t available right now.', 'unsupported')
  if (/rate limit|too many|only request this after/i.test(msg))
    return new ServiceError('Too many attempts. Please wait a minute and try again.', 'denied')
  if (/expired|invalid|incorrect/i.test(msg))
    return new ServiceError('That code is incorrect or has expired.', 'denied')
  return toServiceError(err)
}

/** Sends the verification code to an Indian mobile number. */
export async function sendMobileOtp(mobile: string): Promise<void> {
  if (!isValidIndianMobile(mobile))
    throw new ServiceError('Enter a valid 10-digit mobile number.', 'validation')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(mobile),
      options: { channel: 'sms' },
    })
    if (error) throw error
  } catch (err) {
    throw toOtpError(err)
  }
}

/** Confirms the code. On success the guest holds a phone-only auth session. */
export async function verifyMobileOtp(mobile: string, code: string): Promise<void> {
  const token = code.replace(/\D/g, '')
  if (token.length !== OTP_LENGTH)
    throw new ServiceError(`Enter the ${OTP_LENGTH}-digit code.`, 'validation')
  try {
    const supabase = requireSupabase()
    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(mobile),
      token,
      type: 'sms',
    })
    if (error) throw error
  } catch (err) {
    throw toOtpError(err)
  }
}

export async function signOut(): Promise<void> {
  const supabase = requireSupabase()
  await supabase.auth.signOut()
}
