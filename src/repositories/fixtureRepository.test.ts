import { describe, expect, it, beforeEach } from 'vitest'
import { fixtureRepositories } from './fixtureRepository'

describe('listing repository — filtering & sort (SRCH-01)', () => {
  it('filters by category', async () => {
    const rows = await fixtureRepositories.listings.list({ category: 'venue' })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.category === 'venue')).toBe(true)
  })

  it('filters verified-only', async () => {
    const rows = await fixtureRepositories.listings.list({ verifiedOnly: true })
    expect(rows.every((r) => r.verified)).toBe(true)
  })

  it('sorts by price ascending', async () => {
    const rows = await fixtureRepositories.listings.list({ sort: 'price_low' })
    const prices = rows.map((r) => r.fromPrice?.minorUnits ?? Infinity)
    const sorted = [...prices].sort((a, b) => a - b)
    expect(prices).toEqual(sorted)
  })

  it('returns empty for an impossible query', async () => {
    const rows = await fixtureRepositories.listings.list({ q: 'zzz-no-such-vendor' })
    expect(rows).toEqual([])
  })
})

describe('favourites repository (FAV-01)', () => {
  beforeEach(() => localStorage.clear())

  it('adds and removes idempotently', async () => {
    await fixtureRepositories.favourites.add('lst_usha_resort')
    await fixtureRepositories.favourites.add('lst_usha_resort') // duplicate
    expect(await fixtureRepositories.favourites.ids()).toEqual(['lst_usha_resort'])
    await fixtureRepositories.favourites.remove('lst_usha_resort')
    expect(await fixtureRepositories.favourites.ids()).toEqual([])
  })
})

describe('enquiry repository (ENQ-01)', () => {
  it('creates an enquiry routed to a conversation-ready state', async () => {
    const created = await fixtureRepositories.enquiries.create({
      listingId: 'lst_usha_resort',
      message: 'Hi, checking availability',
      guests: 500,
    })
    expect(created.stage).toBe('new')
    expect(created.vendorName).toBe('Usha Resort')
  })
})
