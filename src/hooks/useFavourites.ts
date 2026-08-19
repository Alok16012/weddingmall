import { useCallback, useEffect, useState } from 'react'
import {
  FAVOURITES_CHANGED_EVENT as EVENT,
  getFavouriteIds,
  toggleFavourite as toggle,
} from '@/services/favourites'

/**
 * The shortlist as this screen sees it.
 *
 * The device copy is the source of truth for rendering — it is instant and
 * works signed out — while `syncShortlist()` merges it with the account copy
 * on sign-in. A window event keeps every mounted component in step, whichever
 * of the two changed.
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
