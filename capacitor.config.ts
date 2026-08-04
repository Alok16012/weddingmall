import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Android wrapper for the live site.
 *
 * `server.url` points the WebView at production rather than at a copy of the
 * built assets, so shipping a web deploy updates the app without a Play Store
 * release. `webDir` still has to exist for the CLI, but nothing in it is what
 * the user actually sees — see `android/README.md`.
 *
 * `androidScheme: 'https'` keeps the WebView origin on https, which is what
 * lets Supabase's session cookies and localStorage survive between launches.
 */
const config: CapacitorConfig = {
  appId: 'online.weddingmall.app',
  appName: 'WeddingMall.Online',
  webDir: 'dist',
  android: {
    // No cleartext anywhere: the site is https-only and so is Supabase.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Lets the site tell the wrapper apart from mobile Chrome — e.g. to drop the
    // "get the app" banner, or to hide a Share button the WebView cannot honour.
    appendUserAgent: 'WeddingMallApp',
  },
  server: {
    url: 'https://weddingmall.online',
    androidScheme: 'https',
    // Only our own origin is treated as "inside" the app. Everything else —
    // payment gateways, maps, WhatsApp — is handed to the system browser or
    // the installed app by `ExternalLinks.java`.
    allowNavigation: ['weddingmall.online', 'www.weddingmall.online'],
  },
}

export default config
