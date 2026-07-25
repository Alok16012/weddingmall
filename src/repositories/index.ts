import { env } from '@/lib/env'
import { fixtureRepositories } from './fixtureRepository'
import type { Repositories } from './types'

/**
 * Repository provider. Today the fixture implementation backs every surface;
 * when VITE_DATA_SOURCE=supabase and adapters land (Phase 4) this swaps to the
 * real backend without any UI changes.
 */
export function getRepositories(): Repositories {
  switch (env.dataSource) {
    case 'supabase':
      // Phase 4: return supabaseRepositories once RLS + schema are live.
      // Falls back to fixtures until then so the app never hard-crashes.
      return fixtureRepositories
    case 'fixtures':
    default:
      return fixtureRepositories
  }
}

export const repositories = getRepositories()
export type { Repositories } from './types'
