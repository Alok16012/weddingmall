import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, assertNoSecretKey } from '@/lib/env'

/**
 * The single Supabase client for the whole app.
 *
 * Uses ONLY the public URL + anon/publishable key. `assertNoSecretKey()` hard-fails
 * the boot if a service_role key is ever placed in a VITE_ variable, so a secret
 * can never ship inside an APK/IPA/JS bundle.
 */
let client: SupabaseClient | null | undefined

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  assertNoSecretKey()
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    client = null
    return client
  }
  client = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // password-reset / magic-link deep links
    },
  })
  return client
}

/** Throws a typed error when the backend is unreachable/unconfigured. */
export function requireSupabase(): SupabaseClient {
  const c = getSupabase()
  if (!c) throw new ServiceError('Backend is not configured.', 'no_client')
  return c
}

export type ServiceErrorCode =
  | 'no_client'
  | 'network'
  | 'not_found'
  | 'denied'
  | 'validation'
  | 'unknown'

/** Centralised, user-safe error type. Never carries secrets or raw tokens. */
export class ServiceError extends Error {
  code: ServiceErrorCode
  constructor(message: string, code: ServiceErrorCode = 'unknown') {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}

/** Map a PostgREST/Supabase error to a safe, human-readable ServiceError. */
export function toServiceError(err: unknown): ServiceError {
  const e = err as { message?: string; code?: string; status?: number } | null
  const msg = e?.message ?? ''
  if (!navigator.onLine) return new ServiceError('You appear to be offline.', 'network')
  if (e?.code === 'PGRST116') return new ServiceError('Not found.', 'not_found')
  if (e?.status === 401 || e?.status === 403 || e?.code === '42501')
    return new ServiceError('You don’t have access to this.', 'denied')
  if (/Failed to fetch|NetworkError/i.test(msg))
    return new ServiceError('Network problem. Please try again.', 'network')
  return new ServiceError(msg || 'Something went wrong. Please try again.', 'unknown')
}
