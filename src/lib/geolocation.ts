import { env } from './env'

/**
 * "Use my current location".
 *
 * Two things have to be true for this to work: the browser/OS grants a position
 * (Capacitor forwards the WebView's permission prompt to the Android and iOS
 * dialogs), and a reverse-geocoding endpoint is configured to turn those
 * coordinates into a city name. `locations` has no latitude/longitude columns,
 * so there is nothing to resolve against locally — hence `VITE_GEOCODE_URL`.
 *
 * The caller checks `canDetectLocation()` first and simply doesn't render the
 * control when it's false.
 */
export function canDetectLocation(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation && !!env.geocodeUrl
}

export type DetectFailure = 'denied' | 'unavailable' | 'timeout' | 'unresolved'

export class LocationError extends Error {
  reason: DetectFailure

  constructor(reason: DetectFailure, message: string) {
    super(message)
    this.name = 'LocationError'
    this.reason = reason
  }
}

const MESSAGES: Record<DetectFailure, string> = {
  denied: 'Location permission was declined. Search for your city instead — everything else works exactly the same.',
  unavailable: 'Your device could not provide a location right now. Please pick your city from the list.',
  timeout: 'Finding your location took too long. Please pick your city from the list.',
  unresolved: 'We could not match your location to a city. Please pick it from the list.',
}

export function locationErrorMessage(err: unknown): string {
  return err instanceof LocationError ? MESSAGES[err.reason] : MESSAGES.unavailable
}

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (e) => {
      const reason: DetectFailure =
        e.code === e.PERMISSION_DENIED
          ? 'denied'
          : e.code === e.TIMEOUT
            ? 'timeout'
            : 'unavailable'
      reject(new LocationError(reason, e.message))
    }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 })
  })
}

interface GeocodeShape {
  city?: string
  locality?: string
  address?: { city?: string; town?: string; village?: string; state_district?: string }
}

/** Resolve the device's position to a city name. Throws `LocationError`. */
export async function detectCity(): Promise<string> {
  if (!canDetectLocation()) throw new LocationError('unavailable', 'Detection not available')
  const pos = await currentPosition()

  const url = new URL(env.geocodeUrl!)
  url.searchParams.set('lat', pos.coords.latitude.toFixed(4))
  url.searchParams.set('lon', pos.coords.longitude.toFixed(4))

  let json: GeocodeShape
  try {
    const res = await fetch(url.toString(), { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    json = (await res.json()) as GeocodeShape
  } catch {
    throw new LocationError('unresolved', 'Reverse geocoding failed')
  }

  const city =
    json.city ??
    json.locality ??
    json.address?.city ??
    json.address?.town ??
    json.address?.village ??
    json.address?.state_district
  if (!city) throw new LocationError('unresolved', 'No city in geocoder response')
  return city
}
