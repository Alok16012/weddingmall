import { describe, expect, it } from 'vitest'
import { mapVendor } from '../vendors'

const row = {
  id: 'v1', name: 'CDS RESORT', email: 'a@b.com',
  category: ['wedding-venues'], location: 'Patna',
  price: '  ', price_unit: 'per day', veg_price: '699/-', non_veg_price: '',
  description: 'x', images: ['u1', 'u2'], image: 'u1',
  rating: 5, status: 'active', badge: 'Most Preferred', is_trending: true,
  amenities: { bridalRoom: true }, payment_policies: { gstIncluded: true },
  created_at: '2026-01-01T00:00:00Z',
}

describe('mapVendor', () => {
  it('maps snake_case rows to the domain type', () => {
    const v = mapVendor(row as never)
    expect(v.vegPrice).toBe('699/-')
    expect(v.isTrending).toBe(true)
    expect(v.amenities.bridalRoom).toBe(true)
  })
  it('treats blank text columns as null', () => {
    expect(mapVendor(row as never).price).toBeNull()
    expect(mapVendor(row as never).nonVegPrice).toBeNull()
  })
  it('falls back to the single image when images[] is empty', () => {
    const v = mapVendor({ ...row, images: [] } as never)
    expect(v.images).toEqual(['u1'])
  })
})
