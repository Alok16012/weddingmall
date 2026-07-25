/** Presentation helpers. Money is stored as integer minor units (paise) + currency. */

export function formatINR(minorUnits: number, opts?: { compact?: boolean }): string {
  const rupees = minorUnits / 100
  if (opts?.compact && rupees >= 100000) {
    const lakhs = rupees / 100000
    // Up to 2 decimals, trailing zeros stripped: 4.5 → "4.5", 5.25 → "5.25".
    const label = parseFloat(lakhs.toFixed(2)).toString()
    return `₹${label}L`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees)
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`
}

/** Relative time in IST-friendly wording; input is a server ISO timestamp. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
