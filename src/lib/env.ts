/**
 * Typed, validated access to client environment.
 * Only the PUBLIC Supabase URL + publishable key are ever read here.
 * The service/secret key must never reach the client bundle.
 */
export type DataSource = 'fixtures' | 'supabase'

function read(key: string): string | undefined {
  const v = import.meta.env[key as keyof ImportMetaEnv] as string | undefined
  return v && v.length > 0 ? v : undefined
}

export const env = {
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabasePublishableKey: read('VITE_SUPABASE_PUBLISHABLE_KEY'),
  dataSource: (read('VITE_DATA_SOURCE') ?? 'fixtures') as DataSource,
} as const

/** Guard: refuse to boot if a service/secret key is accidentally exposed client-side. */
export function assertNoSecretKey(): void {
  const key = env.supabasePublishableKey ?? ''
  if (key.startsWith('sb_secret_') || key.includes('service_role')) {
    throw new Error(
      'SECURITY: a Supabase secret/service key was placed in a VITE_ (client) variable. ' +
        'Only the publishable/anon key may ship in the client bundle.',
    )
  }
}
