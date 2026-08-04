import { useCallback, useEffect, useState } from 'react'

/**
 * How this person entered the app: as a guest, or as a vendor.
 *
 * The installed app opens on a choice — Guest or Vendor — and remembers it, so
 * the choice is asked once per install rather than on every launch. It is a
 * device-local preference, not an account: guests still have no server-side
 * identity, exactly as the enquiry flow assumes.
 *
 * The verified mobile number is kept here too, purely so the enquiry form can
 * prefill it. It never leaves the device on its own, and nothing here is ever
 * logged.
 */
const KEY = 'wm.entry.v1'
const EVENT = 'wm:entry-changed'

export type EntryChoice = 'guest' | 'vendor'

export interface EntryState {
  choice: EntryChoice
  /** 10-digit Indian mobile, digits only. Null when verification was skipped. */
  phone: string | null
  /** True only when a code was actually confirmed by the backend. */
  phoneVerified: boolean
  /** ISO timestamp of the choice, so a future release can expire it. */
  at: string
}

export function getEntry(): EntryState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<EntryState>
    if (parsed.choice !== 'guest' && parsed.choice !== 'vendor') return null
    return {
      choice: parsed.choice,
      phone: typeof parsed.phone === 'string' ? parsed.phone : null,
      phoneVerified: parsed.phoneVerified === true,
      at: typeof parsed.at === 'string' ? parsed.at : new Date().toISOString(),
    }
  } catch {
    // Corrupt or unavailable storage just means "not chosen yet" — never a crash
    // on the very first screen of the app.
    return null
  }
}

export function setEntry(next: Omit<EntryState, 'at'> & { at?: string }): void {
  const state: EntryState = { ...next, at: next.at ?? new Date().toISOString() }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Private-mode storage failure: the user simply gets asked again. */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function clearEntry(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT))
}

/** Reactive view of the stored choice; stays in sync across tabs and screens. */
export function useEntry() {
  const [entry, setState] = useState<EntryState | null>(() => getEntry())

  useEffect(() => {
    const sync = () => setState(getEntry())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const choose = useCallback((next: Omit<EntryState, 'at'>) => setEntry(next), [])
  const reset = useCallback(() => clearEntry(), [])

  return { entry, choose, reset }
}
