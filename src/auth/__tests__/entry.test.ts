import { beforeEach, describe, expect, it } from 'vitest'
import { clearEntry, getEntry, setEntry } from '../entry'

describe('entry choice store', () => {
  beforeEach(() => localStorage.clear())

  it('is empty before a choice is made', () => {
    expect(getEntry()).toBeNull()
  })

  it('round-trips a verified guest', () => {
    setEntry({ choice: 'guest', phone: '9876543210', phoneVerified: true })
    const entry = getEntry()
    expect(entry?.choice).toBe('guest')
    expect(entry?.phone).toBe('9876543210')
    expect(entry?.phoneVerified).toBe(true)
    expect(Date.parse(entry!.at)).not.toBeNaN()
  })

  it('round-trips a vendor with no number', () => {
    setEntry({ choice: 'vendor', phone: null, phoneVerified: false })
    expect(getEntry()).toMatchObject({ choice: 'vendor', phone: null, phoneVerified: false })
  })

  it('treats corrupt or unknown stored values as no choice', () => {
    localStorage.setItem('wm.entry.v1', '{not json')
    expect(getEntry()).toBeNull()
    localStorage.setItem('wm.entry.v1', JSON.stringify({ choice: 'admin' }))
    expect(getEntry()).toBeNull()
  })

  it('never reports a skipped verification as verified', () => {
    localStorage.setItem('wm.entry.v1', JSON.stringify({ choice: 'guest', phoneVerified: 'yes' }))
    expect(getEntry()?.phoneVerified).toBe(false)
  })

  it('clears back to no choice', () => {
    setEntry({ choice: 'guest', phone: null, phoneVerified: false })
    clearEntry()
    expect(getEntry()).toBeNull()
  })
})
