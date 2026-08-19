# Android & iOS — build and release

The app is a mobile-first web build packaged with **Capacitor**. Ordinary code
changes need no macOS; only the final iOS signing/archive steps require Xcode.

## One-time setup

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Wedding Mall" "online.weddingmall.app" --web-dir=dist
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios          # macOS only
```

`capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'online.weddingmall.app',
  appName: 'Wedding Mall',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { backgroundColor: '#FFF9F3', showSpinner: false },
  },
}
export default config
```

## Every build

```bash
npm run build && npx cap sync
```

## Android

**Assets** — 1024×1024 icon + splash, then:
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

**Permissions** (`android/app/src/main/AndroidManifest.xml`) — INTERNET and
ACCESS_NETWORK_STATE are required; CAMERA (optional feature) is what lets the
file chooser offer "take a photo" for the biodata portrait. Geolocation for
"Use my current location" is requested by the WebView at the moment it is used
and needs no manifest entry; the control is hidden unless `VITE_GEOCODE_URL` is
configured. There is no push integration yet — see `docs/DEPLOYMENT.md`.

**Deep links** — both intent filters are already in
`android/app/src/main/AndroidManifest.xml`: the app's own
`online.weddingmall.app://` scheme (works with no server setup) and
`https://weddingmall.online` / `https://www.weddingmall.online` App Links with
`android:autoVerify="true"`.

`src/lib/deepLinks.ts` maps the incoming URL's path straight onto the router, so
**every** route is deep-linkable — `/blogs/<slug>`, `/vendor/<id>`, `/auth/reset`
— not just the password reset. Verification of the https form needs
`/.well-known/assetlinks.json` on the domain carrying the release signing
certificate's SHA-256 (see `docs/DEPLOYMENT.md`); until that is hosted the link
still opens the app, but through the "open with" chooser.

**Debug run**
```bash
npx cap run android
```

**Release (signed AAB)** — create a keystore *you* control (never commit it):
```bash
keytool -genkey -v -keystore weddingmall-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias weddingmall
```
Put credentials in `android/keystore.properties` (gitignored), reference it from
`android/app/build.gradle`, then:
```bash
cd android && ./gradlew bundleRelease     # → app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease                 # → APK, for side-loading tests
```

## iOS (macOS + Xcode required for the final steps)

```bash
npx cap open ios
```
- **Bundle ID:** `online.weddingmall.app` · **Display name:** Wedding Mall
- Icon master: `brand/weddingmall-app-icon-1024.png`; the iOS app icon and launch
  screen are already generated from it.
- `Info.plist` includes camera and photo-library explanations because users can
  choose a portrait for their biodata or vendor listing.
- `Info.plist` declares the `online.weddingmall.app` URL scheme, which needs no
  server setup. For https Universal Links, add the **Associated Domains**
  capability (`applinks:weddingmall.online`) in Xcode and host
  `apple-app-site-association` on the domain — `AppDelegate.swift` already
  forwards both to Capacitor.
- Pods: `cd ios/App && pod install`

**Archive → TestFlight:** Xcode → *Any iOS Device* → Product → Archive →
Distribute App → App Store Connect → Upload.

### App Store readiness checklist
- [ ] Privacy policy + terms URLs (in-app screens exist; host canonical copies on the website)
- [ ] Data-safety / privacy nutrition label: collects **name + phone** for enquiries only
- [ ] Account deletion: no customer accounts exist; vendor accounts are handled by support (state this)
- [ ] Screenshots: 6.7" and 5.5" (iOS), phone + 7"/10" tablet (Android)
- [ ] Guideline 4.2 — the app provides native value beyond the website (offline-tolerant
      browsing, on-device shortlist, native share/tel intents); avoid shipping a bare webview

## Known gaps before store submission
- Push notifications are **not** implemented (no notifications table in the backend).
- Crash reporting is not configured — add Sentry or Firebase Crashlytics.
- Bundle is ~648 kB (189 kB gzip); consider route-level `React.lazy` code-splitting.
