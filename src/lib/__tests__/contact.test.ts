import { describe, expect, it } from 'vitest'
import { resolveVendorContact, telHref, toWhatsappDigits, whatsappMessage } from '../contact'
import { BRAND_NAME, PHONES, WHATSAPP_NUMBER } from '@/config/company'

const vendor = (over: Partial<{ phone: string | null; whatsapp: string | null }> = {}) => ({
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  name: 'Vedanta Banquet',
  phone: null,
  whatsapp: null,
  ...over,
})

describe('toWhatsappDigits', () => {
  it('prefixes India country code onto a bare 10-digit number', () => {
    expect(toWhatsappDigits('98765 43210')).toBe('919876543210')
  })

  it('drops a leading trunk zero', () => {
    expect(toWhatsappDigits('098765 43210')).toBe('919876543210')
  })

  it('rejects a number too short to dial', () => {
    expect(toWhatsappDigits('12345')).toBeNull()
  })
})

describe('telHref', () => {
  it('keeps the plus so the dialer treats it as international', () => {
    expect(telHref('+91 95606 79117')).toBe('tel:+919560679117')
  })

  it('returns null rather than a dead link when there is no number', () => {
    expect(telHref(null)).toBeNull()
    expect(telHref('n/a')).toBeNull()
  })
})

describe('whatsappMessage', () => {
  it('opens with the fixed sentence and appends only what is known', () => {
    const msg = whatsappMessage({ vendorName: 'Vedanta Banquet' })
    expect(msg.split('\n')[0]).toBe(
      `Hi, I found your listing on ${BRAND_NAME} and would like to know more about availability and pricing.`,
    )
    expect(msg).toContain('Listing: Vedanta Banquet')
    expect(msg).not.toContain('Event date')
  })
})

describe('resolveVendorContact', () => {
  it("uses the vendor's own number when the row carries one", () => {
    const { tel, wa, viaDesk } = resolveVendorContact(vendor({ phone: '+91 98765 43210' }))
    expect(tel).toBe('tel:+919876543210')
    expect(wa).toContain('wa.me/919876543210')
    expect(viaDesk).toBe(false)
  })

  it('prefers a separate WhatsApp number over the landline', () => {
    const { wa, viaDesk } = resolveVendorContact(
      vendor({ phone: '+91 98765 43210', whatsapp: '9000000001' }),
    )
    expect(wa).toContain('wa.me/919000000001')
    expect(viaDesk).toBe(false)
  })

  it('falls back to the staffed Wedding Mall desk when the vendor has no number', () => {
    const { tel, wa, viaDesk } = resolveVendorContact(vendor())
    expect(tel).toBe(`tel:${PHONES[0].e164}`)
    expect(wa).toContain(`wa.me/${WHATSAPP_NUMBER}`)
    expect(viaDesk).toBe(true)
  })

  it('carries the listing name and reference so the desk knows what is being asked about', () => {
    const { wa } = resolveVendorContact(vendor())
    const text = decodeURIComponent(new URL(wa!).searchParams.get('text') ?? '')
    expect(text).toContain('Listing: Vedanta Banquet')
    expect(text).toContain('Reference: A1B2C3D4')
  })

  it('includes the event date once the user has chosen one', () => {
    const { wa } = resolveVendorContact(vendor(), { eventDate: '2026-12-04' })
    const text = decodeURIComponent(new URL(wa!).searchParams.get('text') ?? '')
    expect(text).toContain('Event date: 2026-12-04')
  })
})
