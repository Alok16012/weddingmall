/**
 * Favourites / shortlist.
 *
 * This backend has NO favourites table, so the shortlist is stored on-device.
 * It is intentionally local-only rather than faked as server-synced — see
 * docs/SCHEMA.md "Not available in this backend". If a `favourites` table is
 * added later, only this file changes.
 */
const KEY = 'wm.favourites.v2'

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]))
  } catch {
    /* storage full / private mode — shortlist is best-effort */
  }
}

export function getFavouriteIds(): string[] {
  return read()
}

export function isFavourite(id: string): boolean {
  return read().includes(id)
}

/** Returns the new full list so callers can update state in one step. */
export function toggleFavourite(id: string): string[] {
  const cur = read()
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  write(next)
  return next
}

export function clearFavourites(): void {
  write([])
}
