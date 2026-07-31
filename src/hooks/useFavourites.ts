import { useCallback, useEffect, useState } from 'react'
import { getFavouriteIds, toggleFavourite as toggle } from '@/services/favourites'

const EVENT = 'wm:favourites-changed'

/**
 * On-device shortlist (this backend has no favourites table).
 * A window event keeps every mounted component in sync instantly.
 */
export function useFavourites() {
  const [ids, setIds] = useState<string[]>(() => getFavouriteIds())

  useEffect(() => {
    const sync = () => setIds(getFavouriteIds())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggleFavourite = useCallback((id: string) => {
    const next = toggle(id)
    setIds(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return {
    ids,
    count: ids.length,
    isFavourite: useCallback((id: string) => ids.includes(id), [ids]),
    toggle: toggleFavourite,
  }
}
