import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native wrappers around this app's own build.
 *
 * The WebView serves `webDir` from inside the package — the screens in `src/`
 * are what ships, not the website. Vendor listings, enquiries and auth still
 * come live from Supabase, so the catalogue is never stale; only the app's own
 * screens need a store release to change.
 *
 * There is deliberately no `server.url`: pointing it at the website would put
 * the website in the app instead, which is the arrangement this replaced.
 *
 * `androidScheme: 'https'` puts the bundle on the `https://localhost` origin,
 * which is what lets Supabase's session survive between launches — a WebView
 * treats `http:` origins as insecure and can drop their storage.
 */
const config: CapacitorConfig = {
  appId: 'online.weddingmall.app',
  appName: 'Wedding Mall',
  webDir: 'dist',
  android: {
    // No cleartext anywhere: Supabase is https-only and so is everything else
    // the app talks to.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // What `isNativeApp()` reads. The app-only surfaces — the Guest / Vendor
    // entry gate, "Switch login" — key off this, and it also lets the code hide
    // anything a WebView cannot honour, such as `navigator.share`.
    appendUserAgent: 'WeddingMallApp',
  },
  ios: {
    // Match the Android wrapper while respecting iPhone safe areas.
    contentInset: 'automatic',
    appendUserAgent: 'WeddingMallApp',
  },
  server: {
    androidScheme: 'https',
    // The bundle's own origin is the only thing that loads in the WebView.
    // Every outward link — the website, payment gateways, maps, WhatsApp — is
    // handed to the system browser or the app that owns it, by Capacitor for
    // https and by `ExternalLinks.java` for tel/mailto/upi/intent.
    allowNavigation: [],
  },
}

export default config
