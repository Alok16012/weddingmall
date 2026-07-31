import { describe, expect, it } from 'vitest'
import { isValidIndianMobile, normaliseMobile } from '../leads'

describe('Indian mobile validation', () => {
  it('accepts a valid 10-digit number', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true)
  })
  it('accepts +91 and 0 prefixes', () => {
    expect(isValidIndianMobile('+91 98765 43210')).toBe(true)
    expect(isValidIndianMobile('09876543210')).toBe(true)
  })
  it('rejects short, long and invalid-prefix numbers', () => {
    expect(isValidIndianMobile('98765')).toBe(false)
    expect(isValidIndianMobile('1234567890')).toBe(false)
  })
  it('normalises to bare 10 digits', () => {
    expect(normaliseMobile('+91 98765-43210')).toBe('9876543210')
  })
})
