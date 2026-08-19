import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The probe has to tell "this table/column is missing" apart from "you are not
 * allowed to read it". Getting that wrong in the safe direction hides a working
 * feature; getting it wrong the other way lets the app ask PostgREST for a column
 * that does not exist, which fails the *entire* request — that is how the whole
 * catalogue once rendered "No vendors match".
 */
const responses = new Map<string, { error: { code?: string; message?: string } | null }>()

vi.mock('../supabase/client', () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: (column: string) => ({
        limit: () => Promise.resolve(responses.get(`${table}.${column}`) ?? { error: null }),
      }),
    }),
  }),
}))

const { hasCapability } = await import('../supabase/capabilities')

beforeEach(() => {
  sessionStorage.clear()
  responses.clear()
  vi.resetModules()
})

describe('hasCapability', () => {
  it('is false when the table is not exposed', async () => {
    responses.set('bookings.id', {
      error: { code: 'PGRST205', message: "Could not find the table 'public.bookings' in the schema cache" },
    })
    expect(await hasCapability('bookings')).toBe(false)
  })

  it('is false when the column is missing', async () => {
    responses.set('vendors.phone', {
      error: { code: '42703', message: 'column vendors.phone does not exist' },
    })
    expect(await hasCapability('vendorContact')).toBe(false)
  })

  it('is true when the read succeeds', async () => {
    expect(await hasCapability('reviews')).toBe(true)
  })

  it('counts a permission denial as present — the relation exists', async () => {
    responses.set('messages.id', {
      error: { code: '42501', message: 'permission denied for table messages' },
    })
    expect(await hasCapability('messages')).toBe(true)
  })

  it('memoises the verdict for the session', async () => {
    responses.set('shortlists.id', { error: { code: 'PGRST205', message: 'Could not find the table' } })
    expect(await hasCapability('shortlistSync')).toBe(false)
    expect(JSON.parse(sessionStorage.getItem('wm.capabilities.v2')!)).toMatchObject({
      shortlistSync: false,
    })
  })
})
