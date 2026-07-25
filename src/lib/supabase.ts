import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, assertNoSecretKey } from './env'

/**
 * Lazily-created Supabase client using the PUBLIC publishable key only.
 * Returns null when credentials are absent (e.g. fixtures-only mode), so the
 * repository layer can fall back to deterministic fixtures without crashing.
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
      detectSessionInUrl: false,
    },
  })
  return client
}
