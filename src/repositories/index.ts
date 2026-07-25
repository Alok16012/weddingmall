import { env } from '@/lib/env'
import { getSupabase } from '@/lib/supabase'
import { fixtureRepositories } from './fixtureRepository'
import { supabaseRepositories } from './supabaseRepository'
import type { Repositories } from './types'

/**
 * Repository provider. `VITE_DATA_SOURCE` selects the backend without any UI
 * changes. In supabase mode we still fall back to fixtures if the client can't
 * be created (missing env), so the app never hard-crashes.
 */
export function getRepositories(): Repositories {
  switch (env.dataSource) {
    case 'supabase':
      return getSupabase() ? supabaseRepositories : fixtureRepositories
    case 'fixtures':
    default:
      return fixtureRepositories
  }
}

export const repositories = getRepositories()
export type { Repositories } from './types'
