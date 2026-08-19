import { isNativeApp } from './platform'

/**
 * Product analytics.
 *
 * One event vocabulary for all three interfaces. Because Website, Android and
 * iOS run this very bundle, an event fired here is by construction identical
 * across platforms — `platform` is the only property that differs, and it is
 * attached automatically so no call site can forget it.
 *
 * There is no analytics vendor configured on this project yet. Rather than
 * pretend otherwise, this module dispatches to whichever sinks are actually
 * present at runtime (`gtag`, a GTM `dataLayer`) and otherwise keeps events in
 * a small in-memory buffer that `window.__wmAnalytics` exposes for debugging.
 * Wiring a provider later means loading its snippet — no call site changes.
 */
export type AnalyticsEvent =
  | 'venue_view'
  | 'vendor_view'
  | 'call_vendor'
  | 'whatsapp_vendor'
  | 'send_enquiry'
  | 'shortlist_listing'
  | 'booking_created'
  | 'booking_status_changed'
  | 'review_submitted'
  | 'blog_view'
  | 'blog_cta_clicked'
  | 'location_changed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'share_app'

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

/** `web` · `android` · `ios` — sent with every event. */
export function platformName(): 'web' | 'android' | 'ios' {
  if (!isNativeApp()) return 'web'
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'android'
}

interface Recorded {
  event: AnalyticsEvent
  props: AnalyticsProps
  at: string
}

declare global {
  interface Window {
    gtag?: (command: string, name: string, params?: Record<string, unknown>) => void
    dataLayer?: unknown[]
    __wmAnalytics?: Recorded[]
  }
}

const CONSENT_KEY = 'wm.analytics.consent'
const BUFFER_LIMIT = 50

/**
 * Analytics is opt-out rather than opt-in here because the events carry no
 * personal data — listing ids, category slugs and platform, never names, phone
 * numbers or free text. `optOutOfAnalytics()` is honoured immediately and
 * persists, which is what the privacy screen calls.
 */
export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== 'denied'
  } catch {
    return true
  }
}

export function setAnalyticsConsent(granted: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
  } catch {
    /* Storage unavailable — the session simply keeps the default. */
  }
}

/** Fire an event. Never throws: analytics must not be able to break a flow. */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (!hasAnalyticsConsent()) return
  const payload: AnalyticsProps = { platform: platformName(), ...props }

  try {
    const buffer = (window.__wmAnalytics ??= [])
    buffer.push({ event, props: payload, at: new Date().toISOString() })
    if (buffer.length > BUFFER_LIMIT) buffer.shift()

    window.gtag?.('event', event, payload)
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...payload })
  } catch {
    /* Sink missing or blocked by an extension — nothing to do. */
  }
}
