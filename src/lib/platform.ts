/**
 * Where this UI is running.
 *
 * The Android wrapper loads the very same bundle from the very same origin, so
 * the only signal the web code gets is the marker the WebView appends to its
 * user agent (`capacitor.config.ts` → `android.appendUserAgent`). Anything that
 * should behave differently inside the installed app — and only inside it —
 * branches on this.
 */
export function isNativeApp(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('WeddingMallApp')
}
