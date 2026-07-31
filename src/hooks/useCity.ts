import { useCallback, useEffect, useState } from 'react'

const KEY = 'wm.city'
const EVENT = 'wm:city-changed'

/** Selected city, persisted on-device. `null` = all of India. */
export function useCity() {
  const [city, setCityState] = useState<string | null>(() => localStorage.getItem(KEY))

  useEffect(() => {
    const sync = () => setCityState(localStorage.getItem(KEY))
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setCity = useCallback((next: string | null) => {
    if (next) localStorage.setItem(KEY, next)
    else localStorage.removeItem(KEY)
    setCityState(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { city, setCity }
}
