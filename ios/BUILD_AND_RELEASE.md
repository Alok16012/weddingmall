# Building and releasing the iOS app

The iOS project is complete and configured. What it still needs is a machine
with **Xcode** and an **Apple Developer Program** membership — neither exists on
the Mac this was prepared on (see [Why no `.ipa` yet](#why-no-ipa-yet)).

Everything below has already been done in the repository. The steps in
[Building](#building) are what turn it into an uploadable build.

---

## What is already configured

| | |
| --- | --- |
| Bundle identifier | `online.weddingmall.app` — the same string as the Android package |
| Version / build | `MARKETING_VERSION = 1.2.0`, `CURRENT_PROJECT_VERSION = 3` |
| Deployment target | iOS 15.0 |
| Devices | iPhone only (`TARGETED_DEVICE_FAMILY = 1`) |
| Capacitor | 8.5.0 via Swift Package Manager — **no CocoaPods, no `Podfile`** |
| Web content | Served from `App/App/public` inside the bundle. `capacitor.config.ts` has no `server.url`, so the app runs our own build and never loads the website |
| App icon | `App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` — 1024 × 1024, cut from `brand/weddingmall-online-logo.jpeg`, **opaque** (App Store Connect rejects an icon with an alpha channel) |
| Launch screen | `Splash.imageset` — the brand mark on white, matching the Android splash |
| Privacy strings | `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`, both naming the biodata photo picker, which is the only file input in the app |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` |
| Tracking | None. No ATT prompt, no `NSUserTrackingUsageDescription`, no analytics or advertising SDK |

Listing copy, screenshots and the App Privacy answers are in
[`appstore/APP_STORE_LISTING.md`](appstore/APP_STORE_LISTING.md).

---

## Prerequisites

1. **Xcode 15 or newer**, from the Mac App Store or
   [developer.apple.com/download](https://developer.apple.com/download/all/).
   Budget ~40 GB of free disk space for Xcode plus one iOS simulator runtime.
2. Point the command line at it once Xcode is installed:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

3. **Apple Developer Program membership** ($99/year) on the Apple ID you will
   sign in with. A free Apple ID can run the app on your own iPhone for 7 days,
   but cannot upload to TestFlight or the App Store.
4. Node dependencies:

```bash
npm ci
```

---

## Building

Run every command from the repository root.

### 1. Build the web app and copy it into the iOS project

```bash
npm run build && npx cap sync ios
```

`sync` refreshes `ios/App/App/public/` from `dist/` and regenerates
`ios/App/App/capacitor.config.json`. Both are gitignored and rebuilt every time —
never edit them by hand. **Re-run this after every change to `src/`**, otherwise
Xcode will archive a stale bundle.

### 2. Open the project

```bash
npx cap open ios
```

That opens `ios/App/App.xcodeproj`. There is no `.xcworkspace` — this project
uses Swift Package Manager, so Xcode resolves `capacitor-swift-pm` on first open.
Wait for "Resolving Package Graph" to finish before building.

### 3. Select a signing team

In Xcode: **App** target → **Signing & Capabilities** → tick *Automatically
manage signing* and pick your Team. Xcode creates the App ID and provisioning
profile for `online.weddingmall.app` on its own.

The project deliberately does **not** commit a `DEVELOPMENT_TEAM`. It is
per-account, and pinning someone else's team ID only produces a confusing build
failure.

### 4. Run it

- **Simulator:** pick any iPhone destination and press ⌘R, or `npx cap run ios`.
- **A real iPhone:** plug it in, select it as the destination, press ⌘R, then
  trust the developer profile in *Settings → General → VPN & Device Management*.

### 5. Archive and upload

1. Set the destination to **Any iOS Device (arm64)** — Archive is greyed out on a
   simulator destination.
2. **Product → Archive.**
3. In the Organizer that opens: **Distribute App → App Store Connect → Upload**.
4. Leave *Upload your app's symbols* ticked and let Xcode manage signing.

The build appears in App Store Connect under TestFlight after processing
(usually 5–30 minutes). Install it from TestFlight on a real iPhone and smoke-test
before submitting for review.

<details>
<summary>Command-line equivalent, once signing works in Xcode</summary>

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive archive
```

```bash
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist -exportPath build/ipa
```

`ios/ExportOptions.plist` is not committed because it carries your team ID.
Create it locally — it is not a secret, but it is not shared either:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key><string>app-store-connect</string>
	<key>teamID</key><string>YOUR_TEAM_ID</string>
	<key>uploadSymbols</key><true/>
	<key>signingStyle</key><string>automatic</string>
</dict>
</plist>
```

</details>

---

## Raising the version for the next release

Both numbers live in `ios/App/App.xcodeproj/project.pbxproj`, in the Debug *and*
Release configurations:

- `MARKETING_VERSION` — the public version, e.g. `1.2.1`. Matches Android's `versionName`.
- `CURRENT_PROJECT_VERSION` — the build number. Must increase on every upload,
  even for the same marketing version. Matches Android's `versionCode`.

---

## Secrets

The same rules as the Android build, and they are not negotiable:

- The app ships **only** the Supabase URL and the anon/publishable key. The
  `service_role` key must never appear in the app, the repository, an
  `.xcconfig`, an environment variable read at build time, or the `.ipa`.
- Signing certificates and private keys stay in the macOS Keychain. Never export
  a `.p12` into the repository.
- App Store Connect API keys (`AuthKey_*.p8`), if you later automate uploads,
  belong outside the repository — `~/.weddingmall/` is where the Android upload
  keystore already lives.
- Demo credentials for App Review go in App Store Connect's own fields, not in
  any file here.

---

## Why no `.ipa` yet

The Mac this was prepared on cannot produce one, for three independent reasons:

1. **No Xcode.** `xcode-select -p` points at `/Library/Developer/CommandLineTools`.
   There is no iOS SDK, no simulator, and no `xcodebuild`.
2. **No disk space.** 4.5 GB free against roughly 40 GB needed for Xcode and a
   simulator runtime.
3. **No Apple Developer account on this machine.** Signing an `.ipa` requires a
   certificate and provisioning profile issued to a paid membership, and creating
   one means signing in with an Apple ID and password.

Install Xcode, sign in with your own developer account, and run the steps above —
the project itself needs no further changes.
