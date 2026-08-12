# App Store listing — WeddingMall.Online (iOS)

Everything App Store Connect asks for, written out so it can be pasted in.
Assets referenced here live beside this file. The build steps are in
[`ios/BUILD_AND_RELEASE.md`](../BUILD_AND_RELEASE.md).

| Field | Value |
| --- | --- |
| Bundle ID | `online.weddingmall.app` |
| Version | 1.2.0 (build 3) |
| SKU | `weddingmall-online-ios` |
| Primary language | English (India) |
| Primary category | Lifestyle |
| Secondary category | Shopping |
| Age rating | 4+ |
| Price | Free |
| In-app purchases | None |
| Devices | iPhone only (`TARGETED_DEVICE_FAMILY = 1`) |
| Minimum iOS | 15.0 |

The bundle identifier is deliberately the same string as the Android package
name. They live in different namespaces, so this is allowed and keeps one
identity across both stores.

---

## App name (30 characters max)

```
WeddingMall.Online
```

18 characters.

## Subtitle (30 characters max)

```
Venues, vendors & biodata
```

25 characters.

## Promotional text (170 characters max, editable without a new build)

```
Browse verified wedding venues and vendors across India — no sign-up — and build a print-ready matrimonial biodata for free.
```

124 characters.

## Keywords (100 characters max, comma separated, no spaces)

```
wedding,venue,banquet,hall,marriage,shaadi,biodata,matrimony,catering,makeup,photographer,decor
```

95 characters, 12 terms.

Words already in the app name or subtitle are omitted — Apple indexes those
separately, so repeating them wastes the budget.

## Description (4000 characters max)

```
Plan your wedding from one app. WeddingMall.Online brings together verified wedding venues, banquet halls, marriage gardens, makeup artists, photographers, mehendi artists, caterers and decorators from across India — and adds a free matrimonial biodata maker on top.

BROWSE WITHOUT SIGNING UP
Open the app and start looking. No account, no OTP, no form before you can see a single venue. Pick your city, or browse all of India.

FIND THE RIGHT VENUE
• Filter by category — wedding venues, banquet halls, marriage gardens and lawns, wedding resorts, small function halls, budget halls and hotels
• See seating and floating capacity before you enquire, so you only shortlist places that fit your guest list
• Photo galleries, veg and non-veg per-plate pricing, amenities and location on every listing
• Sort by what matters to you and search by name

EVERY WEDDING SERVICE IN ONE PLACE
Makeup artists, photographers, mehendi artists, planning and decor, catering and more — each with photos, pricing where the vendor has shared it, and a direct way to get in touch.

SHORTLIST AND COMPARE
Tap the heart on anything you like. Your shortlist lives on your iPhone, ready when you sit down to compare options with family.

ENQUIRE IN SECONDS
Send your name, mobile number and wedding date to a vendor and they call you back. No lengthy forms, and your details go only to the vendor you picked.

FREE MATRIMONIAL BIODATA MAKER
Make a professional marriage biodata in a few minutes:
• Answer simple questions — personal details, family, education, career, expectations
• Choose from elegant print-ready designs
• Add your photo
• Download a sharp A4 PDF that prints cleanly and shares straight to WhatsApp

Everything you type into the biodata maker, and the photo you add, stays on your iPhone. Nothing is uploaded to us.

FOR VENDORS
Registered your business on WeddingMall.Online? Sign in with your email to see the enquiries your listing has received, with the customer's name, number and wedding date, so you can follow up while the lead is warm.

WHY WEDDINGMALL.ONLINE
• Free for couples — you only pay the vendors you book
• Real listings with real photographs, not stock images
• Coverage across Indian states and cities, including tier-2 and tier-3 towns
• No ads and no third-party trackers in the app

Questions or feedback: support@weddingmall.online
```

2,356 characters.

## What's New in 1.2.0

```
First release of WeddingMall.Online for iPhone.

• Browse wedding venues and vendors across India without an account
• Seating and floating capacity shown on every venue
• Photo galleries, per-plate pricing and amenities on each listing
• Shortlist vendors and send an enquiry in seconds
• Free matrimonial biodata maker with print-ready A4 PDFs
• Vendor sign-in to follow up on enquiries
```

## URLs

| Field | Value | Status |
| --- | --- | --- |
| Support URL | `https://weddingmall.online/` | Live |
| Marketing URL | `https://weddingmall.online/` | Live |
| Privacy Policy URL | `https://weddingmall.online/privacy` | ⚠️ **404 — must be published first** |

`android/play/privacy-policy.html` is a finished, self-contained page covering
both the Android and the iOS app. Publish it at the address above (or anywhere
publicly reachable, and use that address instead). Apple will not let the
submission through without a reachable privacy policy URL.

`support@weddingmall.online` must exist and be monitored — Apple emails it and
checks that deletion requests have somewhere to go.

---

## Graphics

| Asset | File | Size |
| --- | --- | --- |
| App icon | `icon-1024.png` | 1024 × 1024, opaque, no alpha |
| iPhone 6.9" screenshots | `screenshots/iphone-6.9/01…06` | 1320 × 2868 |
| iPhone 6.5" screenshots | `screenshots/iphone-6.5/01…06` | 1242 × 2688 |

Apple requires the 6.9" set; the 6.5" set is uploaded alongside it so older
iPhone listing pages show correctly sized images instead of scaled ones. No
iPad screenshots are needed — the app ships as iPhone-only.

Screenshot order and suggested captions:

1. `01-welcome` — “Browse as a guest, or sign in as a vendor”
2. `02-home` — “Every wedding service, one app”
3. `03-services` — “Venues, makeup, photography, catering and more”
4. `04-explore` — “Filter by capacity, price and city”
5. `05-venue-detail` — “Photos, pricing and capacity before you enquire”
6. `06-biodata` — “Free matrimonial biodata maker”

All six were captured from the app running its own bundle, at the exact device
metrics Apple expects, with no device frames or marketing overlays.

---

## App Privacy (the nutrition label)

Each answer reflects code in this repository, not an aspiration.

**Do you or your third-party partners collect data from this app?** Yes.

### Data types to declare as collected

| Data type | Linked to the user | Used for tracking | Purpose |
| --- | --- | --- | --- |
| Contact Info → Name | Yes | No | App Functionality |
| Contact Info → Phone Number | Yes | No | App Functionality |
| Contact Info → Email Address | Yes | No | App Functionality |
| Contact Info → Other User Contact Info (wedding date) | Yes | No | App Functionality |

Name, phone number and wedding date are collected only when someone sends an
enquiry, and are delivered to the vendor that enquiry was addressed to. Email
address is collected only for vendors signing in to a business account.
Supabase stores all of it on our behalf as a processor.

### Data types to declare as NOT collected

- **Photos or Videos.** The biodata maker's photo is read by the web view,
  rendered into the PDF on the device, and never uploaded. `PhotoPicker.tsx` is
  the only file input in the app.
- **Location.** No location permission is requested and geolocation is not used.
  City selection is a manual choice stored on the device.
- **Identifiers, Usage Data, Diagnostics.** There is no analytics SDK, no
  advertising SDK and no crash reporter in the app.
- **Financial Info, Health, Sensitive Info, Contacts, Search History, Browsing
  History, Purchases, User Content.** Not touched.

**Does this app use data for tracking, as defined by App Tracking
Transparency?** No — so no `NSUserTrackingUsageDescription` and no ATT prompt.

### Purpose strings already in `Info.plist`

| Key | Why |
| --- | --- |
| `NSCameraUsageDescription` | The biodata maker's photo picker, when the user chooses to take a photo |
| `NSPhotoLibraryUsageDescription` | The biodata maker's photo picker, when the user chooses an existing photo |

`ITSAppUsesNonExemptEncryption` is set to `false`, so App Store Connect stops
asking the export-compliance question on every upload. That is accurate: the app
uses HTTPS and adds no cryptography of its own.

---

## Age rating questionnaire

Answer **None** to every content question — violence, sexual content, profanity,
horror, gambling, contests, alcohol/tobacco/drugs, medical information, and
unrestricted web access. The app shows curated vendor listings; there is no
user-to-user messaging, no user-generated public content, no in-app purchases
and no ads. Expected result: **4+**.

The one to think about is *Unrestricted Web Access* — answer **No**. The app
serves its own bundle from inside the package and `allowNavigation` is empty, so
it is not a general-purpose browser.

---

## App Review notes

Paste this into the *Notes* field so the reviewer does not get stuck:

```
No account is required to use this app.

On first launch the app asks "How would you like to continue?".
Tap "Guest Login", then tap "Skip for now" on the next screen — SMS
verification is optional and skipping it gives full access to every
customer feature: browsing venues and vendors, shortlisting, sending an
enquiry, and the free matrimonial biodata maker.

"Vendor Login" is for businesses that have registered a listing with us.
It shows that vendor the enquiries their own listing received. Demo
credentials are provided in the fields below.

The biodata maker reads a photo only if the user picks one. The photo is
rendered into a PDF on the device and is never uploaded.

The app has no ads, no analytics and no third-party trackers.
```

⚠️ **A demo vendor account must be supplied in the "Sign-in required" fields.**
Apple rejects submissions with a login screen and no working credentials
(Guideline 2.1). Create a real vendor account in the production Supabase project
and enter its email and password in App Store Connect — never in this
repository.

⚠️ **Guest SMS verification currently fails.** The Supabase phone provider is
disabled, so requesting a code returns `phone_provider_disabled`. "Skip for now"
is the path the review notes send the reviewer down, so this does not block
review — but enable a phone provider, or hide the verification step, before
users hit it in production.

---

## Pre-submission checklist

- [ ] Privacy policy published and reachable at the URL entered in App Store Connect
- [ ] `support@weddingmall.online` mailbox created and monitored
- [ ] Demo vendor credentials entered in App Store Connect (not in this repo)
- [ ] Apple Developer Program membership active, and a Team selected in Xcode
- [ ] Archive uploaded from Xcode and processed in App Store Connect
- [ ] App Privacy answers completed as above
- [ ] Age rating questionnaire completed → 4+
- [ ] 6.9" and 6.5" screenshots and the 1024 icon uploaded
- [ ] Export compliance auto-answered by `ITSAppUsesNonExemptEncryption`
- [ ] TestFlight build installed on a real iPhone and smoke-tested before release
