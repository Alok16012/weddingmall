import { describe, expect, it } from 'vitest'
import { formatINR, formatDistanceKm } from './format'

describe('formatINR', () => {
  it('renders minor units as INR', () => {
    expect(formatINR(2800000)).toBe('₹28,000')
  })
  it('compacts lakhs', () => {
    expect(formatINR(52500000, { compact: true })).toBe('₹5.25L')
    expect(formatINR(45000000, { compact: true })).toBe('₹4.5L')
  })
})

describe('formatDistanceKm', () => {
  it('shows metres below 1km', () => {
    expect(formatDistanceKm(0.4)).toBe('400 m')
  })
  it('shows km with one decimal', () => {
    expect(formatDistanceKm(4.2)).toBe('4.2 km')
    expect(formatDistanceKm(6)).toBe('6 km')
  })
})
