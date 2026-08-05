# Play Store listing — WeddingMall.Online

Everything the Play Console asks for at submission, written out so it can be
pasted in. Assets referenced here live beside this file.

| Field | Value |
| --- | --- |
| Package name | `online.weddingmall.app` |
| Version | 1.2.0 (versionCode 3) |
| Default language | English (India) — `en-IN` |
| Category | Lifestyle |
| Contains ads | No |
| In-app purchases | No |
| Target audience | 18 and over |

---

## App name (30 characters max)

```
WeddingMall.Online
```

18 characters. If a search keyword is wanted in the title, `WeddingMall.Online: Venues`
(26) also fits; do not exceed 30 or the Console truncates it.

## Short description (80 characters max)

```
Wedding venues & vendors across India, plus a free matrimonial biodata maker.
```

77 characters.

## Full description (4000 characters max)

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
Tap the heart on anything you like. Your shortlist lives on your phone, ready when you sit down to compare options with family.

ENQUIRE IN SECONDS
Send your name, mobile number and wedding date to a vendor and they call you back. No lengthy forms, and your details go only to the vendor you picked.

FREE MATRIMONIAL BIODATA MAKER
Make a professional marriage biodata in a few minutes:
• Answer simple questions — personal details, family, education, career, expectations
• Choose from elegant print-ready designs
• Add your photo
• Download a sharp A4 PDF that prints cleanly and shares straight to WhatsApp

Everything you type into the biodata maker, and the photo you add, stays on your phone. Nothing is uploaded to us.

FOR VENDORS
Registered your business on WeddingMall.Online? Sign in with your email to see the enquiries your listing has received, with the customer's name, number and wedding date, so you can follow up while the lead is warm.

WHY WEDDINGMALL.ONLINE
• Free for couples — you only pay the vendors you book
• Real listings with real photographs, not stock images
• Coverage across Indian states and cities, including tier-2 and tier-3 towns
• No ads and no third-party trackers in the app

Questions or feedback: support@weddingmall.online
```

2,354 characters — well inside the 4,000 limit.

---

## Graphics

| Asset | File | Size | Notes |
| --- | --- | --- | --- |
| App icon | `icon-512.png` | 512 × 512 | 32-bit PNG, cut from `brand/weddingmall-online-logo.jpeg` |
| Feature graphic | `feature-graphic-1024x500.png` | 1024 × 500 | No text within 64 px of any edge |
| Phone screenshots | `screenshots/01…06` | 1080 × 1920 | 9:16, captured from the app running on the release build's own bundle |

Screenshot order and suggested captions:

1. `01-welcome.png` — “Browse as a guest, or sign in as a vendor”
2. `02-home.png` — “Every wedding service, one app”
3. `03-services.png` — “Venues, makeup, photography, catering and more”
4. `04-explore.png` — “Filter by capacity, price and city”
5. `05-venue-detail.png` — “Photos, pricing and capacity before you enquire”
6. `06-biodata.png` — “Free matrimonial biodata maker”

Play requires between 2 and 8 phone screenshots; all six above qualify. No tablet or
Wear screenshots are needed unless those form factors are opted into.

---

## Privacy policy

**URL to enter in the Console:** `https://weddingmall.online/privacy`

⚠️ **That URL does not exist yet — it currently returns 404, and Play rejects a
submission whose privacy policy URL is unreachable.** `privacy-policy.html` in this
folder is a finished, self-contained page written to match what the app actually does.
Publish it at that address (or anywhere publicly reachable, and use that address
instead) before submitting.

The mailbox it names, `support@weddingmall.online`, must also exist and be monitored —
Play checks that deletion requests have somewhere to go.

---

## Data safety form

Answer the Console's questions as follows. Each answer reflects code in this repository,
not an aspiration.

**Does your app collect or share any of the required user data types?** Yes.

**Is all of the user data collected by your app encrypted in transit?** Yes — the app
talks only to Supabase over HTTPS, and `allowMixedContent` is off.

**Do you provide a way for users to request that their data be deleted?** Yes — by email
to the address in the privacy policy. In-app, *More → Privacy & Data → Clear on-device
data* erases everything held locally.

### Data types to declare

| Data type | Collected | Shared | Purpose | Required or optional |
| --- | --- | --- | --- | --- |
| Personal info → Name | Yes | Yes — with the vendor contacted | App functionality | Optional (only when sending an enquiry) |
| Personal info → Phone number | Yes | Yes — with the vendor contacted | App functionality, Account management | Optional (enquiry, or guest verification) |
| Personal info → Email address | Yes | No | Account management | Optional (vendor sign-in only) |
| Personal info → Other info (wedding date) | Yes | Yes — with the vendor contacted | App functionality | Optional |

"Shared" is set because an enquiry is delivered to the third-party vendor it was
addressed to. Supabase is a processor, not a recipient, so it does not make this a
sharing disclosure on its own.

### Data types to declare as NOT collected

- **Photos and videos.** The biodata maker's photo is read by the WebView, rendered into
  the PDF on the device and never uploaded. Declare photos as not collected, and use the
  camera permission declaration to explain the on-device use.
- **Location.** No location permission is declared and geolocation is disabled in the
  WebView. City selection is a manual choice stored locally.
- **App activity, app info and performance, device IDs.** No analytics or crash-reporting
  SDK is present.
- **Financial info, health, messages, contacts, calendar, files.** Not touched.

### Permission declarations

| Permission | Declared because | What to tell Play |
| --- | --- | --- |
| `INTERNET`, `ACCESS_NETWORK_STATE` | Loading listings; the offline screen | Core functionality |
| `CAMERA` | The biodata maker's photo picker | Used only when the user chooses to take a photo for their own biodata; the image stays on the device |
| `WRITE_EXTERNAL_STORAGE` (maxSdkVersion 28) | Saving a downloaded biodata PDF on Android 9 and older | Legacy download support |

---

## Content rating questionnaire

Answer **no** to every question in the violence, sexuality, language, controlled
substance, gambling and user-generated-content sections. The app shows vendor listings
curated by WeddingMall; there is no user-to-user messaging, no user-generated public
content and no in-app purchases. Expected outcome: rated for everyone (IARC 3+ / ESRB
Everyone), with the app itself set to an 18+ target audience because wedding planning
is an adult activity.

---

## Release notes — 1.2.0 (versionCode 3)

English (India), under the 500-character limit:

```
The app now runs its own screens from inside the package instead of loading the website, so it opens faster and keeps working on a weak connection.

• Guest or vendor entry screen on first launch
• Seating and floating capacity shown on venue listings
• Wedding Services "View all" opens the full category list
• Complete city and state coverage across India, including Jharkhand
• Free matrimonial biodata maker with print-ready A4 PDFs
• New app icon and branding
```

---

## Pre-submission checklist

- [ ] Privacy policy published and reachable at the URL entered in the Console
- [ ] `support@weddingmall.online` mailbox created and monitored
- [ ] `app-release.aab` uploaded (Play requires the App Bundle; the APK is for sideload testing)
- [ ] Play App Signing enrolled, with the upload key from `~/.weddingmall/weddingmall-upload.jks`
- [ ] Keystore and `keystore.properties` backed up somewhere outside this machine — losing them means never updating this listing again
- [ ] Data safety form completed as above
- [ ] Content rating questionnaire completed
- [ ] Target audience set to 18+
- [ ] Screenshots, feature graphic and 512 icon uploaded
