# Wedding Mall — Cross-Platform Correction & Upgrade

Delivery report for the `cross_platform_product_correction_and_upgrade` brief.
Commit `b25d675` on `agent/ios-app-branding`.

Android and iOS are Capacitor wrappers around the **same** React build
(`webDir: dist`, no `server.url`). Every "Website change" below is therefore
also an Android and iOS change; the platform sections list only what is
genuinely native or platform-conditional.

---

## Website Changes

### Brand and company information

- Customer-facing name is **Wedding Mall** everywhere. `Wedding Mall.Online` no
  longer appears as a brand anywhere in the UI.
- `src/config/company.ts` is the single source: brand name, legal name
  (`Wedding Mall Online Pvt. Ltd.`), both phone numbers, `contact@weddingmall.online`,
  the Patna office address, tagline and proposition.
- Phones are `tel:` links, email is `mailto:`, the address opens maps/directions.
- Full company block appears on Contact, About/Careers, Terms, Privacy and the
  footer — **not** repeated down the homepage.

### Homepage

- "Plan Your Dream Wedding" renders on one line at every tested width
  (320 → 1920px; verified, see QA).
- Wedding Services shows exactly **four** categories plus **View All**. No
  category was deleted from the database — `src/types/domain.ts` keeps the full
  list and `/services` shows all of them; only homepage visibility changed.
- All listing-count UI ("120 options", "45 vendors", "20 venues") removed. The
  only number left on a card is the photo count, which is a real property of the
  listing and now carries an `aria-label`.

### Navigation

- Bottom navigation: **Home · Venue · Vendors · Shopping · More** — one IA,
  identical on web, Android and iOS.
- More menu is grouped into **Planning** (Location, Shortlist, My Bookings,
  Inbox, Notifications), **Tools** (Free Biodata Maker, Write a Review, Wedding
  Ideas & Inspiration) and **App** (Share App, Replay app tour, Contact,
  Careers, Privacy, Terms), each row with an icon.

### Onboarding

- Seven-step spotlight tour on first run, controls **Next / Skip / Got It**.
  Completion persists to `wm.onboarding.v1`; replayable from More → Replay app
  tour. Fires `onboarding_started` / `onboarding_completed`.

### Enquiry workflow (replaces the dead "Price on Request")

- `/enquiry/:vendorId` collects Name, Mobile, Email, Event Date, Event Type,
  Guests, City, Message.
- Submits a real row to `leads`, associated with the signed-in user and the
  listing, shows a confirmation with a reference, and opens a booking record.
- The wider fields (email/event type/guests/city/message) are written only where
  the `leadDetails` capability is present; the core enquiry always writes.

### Contact actions

- Call uses the vendor's own registered number. WhatsApp opens with
  "Hi, I found your listing on Wedding Mall and would like to know more about
  availability and pricing."
- CTA group is Call · WhatsApp · Enquire, on the listing rows (`/venues`,
  `/vendors`), the cards and the detail screen.
- `resolveVendorContact()` in `src/lib/contact.ts` decides where a tap lands.
  A vendor with its own number is reached directly. No vendor has one yet — the
  live `vendors` table has no phone column — so both actions currently route to
  the staffed Wedding Mall desk (+91 9560679117), with the listing name and an
  8-character listing reference carried in the WhatsApp opener so the team knows
  which venue is being asked about. Both numbers are real and answered: nothing
  here is a dummy CTA.
- That routing is disclosed to the user, never hidden: the detail screen and
  cards show "Call and WhatsApp reach the Wedding Mall helpdesk, who will connect
  you with this listing", and the compact row icons carry the same wording in
  their `aria-label` and `title`. The `call_vendor` / `whatsapp_vendor` events
  both send `via_desk` so the split is measurable.
- The moment migration 0001 lands and a vendor row carries a number, that
  vendor's own line wins automatically on every surface — no further code change.

### Bookings, Inbox, Shortlist, Reviews

- **My Bookings** shows the real pipeline: Enquiry Sent → Vendor Responded →
  Tentative → Booking Confirmed → Completed. The customer screen can never
  advance a status; only the vendor can. An enquiry is never shown as confirmed.
- **Inbox** threads read and write `conversations` / `messages`.
- **Shortlist** keeps a device copy and merges it into the account's rows on sign
  in (`syncShortlist()`), so it is the same list on web and phone.
- **Write a Review** posts to `reviews` and fires `review_submitted`.

### Blog → Wedding Ideas & Inspiration

- Retitled, subtitle "Expert advice, real weddings, planning guides and
  inspiration for every celebration."
- Per-article `Article` + `BreadcrumbList` JSON-LD, canonical URL, Open Graph and
  Twitter tags, visible breadcrumb, share button, in-app rendering, a
  "Ready to start planning?" CTA card and a related-listings carousel.
- Fires `blog_view` and `blog_cta_clicked`.

### Analytics

All fifteen required events are wired, with `platform` (`web`/`android`/`ios`)
on every one: `venue_view`, `vendor_view`, `call_vendor`, `whatsapp_vendor`,
`send_enquiry`, `shortlist_listing`, `booking_created`, `booking_status_changed`,
`review_submitted`, `blog_view`, `blog_cta_clicked`, `location_changed`,
`onboarding_started`, `onboarding_completed`, `share_app`.

`booking_created` fires only when a booking row actually comes back.

### Accessibility

- Every interactive control is ≥44px. Two were not and were fixed this pass:
  the "View all" section links and the search-clear button.
- Photo-count badges, the notification badge and the availability calendar cells
  have screen-reader labels.
- State is never communicated by colour alone — unread carries the word "New",
  availability cells carry a letter code (A/E/T/C/B) beside the colour.

---

## Android Changes

- `AndroidManifest.xml`: deep links for the `online.weddingmall.app` scheme and
  `android:autoVerify="true"` App Links for `weddingmall.online` and
  `www.weddingmall.online`.
- `@capacitor/app@8.1.1` added and synced; cold-start (`getLaunchUrl()`) and warm
  (`appUrlOpen`) deep links both route into React Router.
- App name is "Wedding Mall" in `strings.xml`.
- Permissions are INTERNET, ACCESS_NETWORK_STATE and CAMERA only. Geolocation
  needs no manifest entry and the control is hidden unless `VITE_GEOCODE_URL` is
  set.
- `npx cap sync` run; `android/app/src/main/assets/public` carries the new build.

## iOS Changes

- `Info.plist`: camera and photo-library purpose strings now say "Wedding Mall"
  (they previously said "WeddingMall.online").
- `CFBundleURLTypes` added for the `online.weddingmall.app` scheme.
- `@capacitor/app` added to `CapApp-SPM/Package.swift` by `cap sync`.
- Same deep-link handler as Android.
- Universal Links additionally need the Associated Domains capability and a
  hosted AASA file — see Deployment Requirements.

---

## Backend Changes

### Database schema

Two runnable migrations in `supabase/migrations/`:

**`0001_marketplace_workflows.sql`**
- `vendors.phone`, `vendors.whatsapp`
- `leads` widened: `customer_email`, `event_type`, `guest_count`, `city`, `message`
- `bookings` (reference, status, event_date, guest_count, contact fields)
- `reviews`, `conversations`, `messages`, `shortlists`, `vendor_availability`,
  `user_app_state`
- RLS on every new table: a customer sees only their own rows, a vendor only
  rows belonging to their vendor record.

**`0002_notifications.sql`**
- `notifications` table plus two triggers:
  - `notify_customer_of_booking_status()` on `after update of status on bookings`
    — `booking_confirmed` when the new status is confirmed, otherwise
    `booking_status_changed`, linking to `/bookings`.
  - `notify_of_message()` on `after insert on messages` — a vendor sender
    notifies the customer (`vendor_replied`, links to the thread); a customer
    sender notifies the vendor (`message_received`, links to `/vendor/leads`).
- New-enquiry notifications are already covered by 0001.

Both migrations are idempotent and can be re-run.

### API

All data access is PostgREST through the Supabase JS client. No new server.
Privileged work, if it is ever needed, must go through an Edge Function — the
client bundle carries the public anon key only.

### Authentication

Unchanged. Vendor email/password sign-in and the guest phone-verify path both
still work; no auth code was rewritten. The one addition is a `useEffect` in
`SessionContext` that merges the device shortlist once a user id appears.

### Notification handling

In-app notifications are real and trigger-driven — rows are written by the
database, not synthesised in the client. The unread badge on the More tab and
the vendor dashboard banner both read `notifications`. Push delivery (FCM/APNs)
is **not** implemented; it is credential- and store-dependent.

### Cross-platform sync

One schema, one API, one data model. Shortlist, bookings, enquiries, inbox and
notifications are the same rows regardless of which platform wrote them.

### Capability probing

Every migration-dependent feature calls `hasCapability()` before it renders.
The probe reads one row and inspects PostgREST's error code (`42703`,
`PGRST204`, `PGRST205`, `42P01`). A permission denial counts as *present* — the
relation exists, the user just is not authorised yet. Verdicts are memoised in
`sessionStorage` under `wm.capabilities.v2`.

---

## QA

### Website

- `npx tsc -b` — clean.
- `npm run lint` (oxlint) — 0 errors, 11 pre-existing style warnings.
- `npm test` — 10 files, 58 tests, all passing.
- `npm run build` — succeeds.
- Responsive pass at **320, 375, 390, 430, 768, 1024, 1280, 1440, 1920px**:
  zero horizontal overflow at every width, and "Plan Your Dream Wedding" on one
  line at every width.
- Route pass at 375px across `/`, `/venues`, `/vendors`, `/shopping`,
  `/bookings`, `/inbox`, `/notifications`, `/blogs`, `/biodata`, `/city`,
  `/review`, `/contact`, `/favourites`, `/services`, `/more` — all render, none
  overflow, no control under 44px.
- Onboarding tour driven end to end: 7 steps, Next ×6 then "Got It", completion
  written to `wm.onboarding.v1`.
- Bottom nav verified as exactly Home / Venue / Vendors / Shopping / More.
- Homepage verified to show exactly 4 categories + View All, no listing counts,
  and no "Wedding Mall.Online" string anywhere in the rendered text.
- Live capability probe verified against the production database: `vendorContact`
  and `notifications` correctly resolve **false**, and the catalogue renders 12
  real Patna venues with real photos and real prices.

### Android / iOS

- `npx cap sync` succeeds for both platforms; both report
  `@capacitor/app@8.1.1` and `@capacitor/share@8.0.1`.
- `pathFromDeepLink()` is unit-tested (5 cases) including rejection of
  `example.com`, the look-alike `weddingmall.online.evil.test`, `javascript:`
  URLs and malformed input.
- **Not run:** a device/emulator build, and therefore no on-device verification
  of the deep links, the camera permission strings or the store builds. Both
  wrappers load the identical bundle that passed the web pass above.

### End-to-end tests

None added. The workflows that would be worth an e2e test — enquiry → booking →
status change → notification — cannot execute against the live database until
the migrations are applied, so an e2e suite written now would only assert the
capability-gated empty states.

### Known issues

1. **The live database has only `vendors`, `leads` and `blogs`.** `bookings`,
   `reviews`, `messages`, `conversations`, `shortlists`, `vendor_availability`,
   `notifications` and `user_app_state` all return 404 until migration 0001/0002
   is applied. Every dependent feature is built and gated, not mocked — it will
   light up the moment the migrations run.
2. **`vendors` has no phone/whatsapp column,** so no listing can be dialled
   directly. Call and WhatsApp therefore route to the Wedding Mall desk
   (+91 9560679117) and say so on screen — a real staffed line, not a dummy CTA,
   but the owner's team answers rather than the venue and has to hand the enquiry
   on. Migration 0001 adds the columns; once a vendor's number is filled in, that
   vendor's own line takes over automatically.
3. **Push notifications are not implemented.** In-app notifications are.
4. **Review photo upload is not implemented** — it needs a Supabase Storage
   bucket that does not exist yet.
5. **`locations` has no lat/lng**, so "detect my city" needs an external geocoder
   (`VITE_GEOCODE_URL`). Unset by default and the control stays hidden.
6. Bundle chunks exceed 500 kB (pre-existing; the PDF/biodata dependencies
   dominate). Not addressed this pass.

---

## Deployment Requirements

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Public project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | Anon / publishable key **only** |
| `VITE_DATA_SOURCE` | yes | `supabase` |
| `VITE_GEOCODE_URL` | no | Reverse-geocode endpoint; the location-detect control stays hidden without it |

**Never** put the `service_role` key, the database password or the JWT secret in
a `VITE_` variable — they would ship in the browser bundle.
`assertNoSecretKey()` in `src/lib/env.ts` makes the app refuse to boot if one is
detected.

### API keys / owner actions

- Run `supabase/migrations/0001_marketplace_workflows.sql` then
  `0002_notifications.sql` against the project. Requires the project owner's own
  credentials — the app has the public key only, so this cannot be done from the
  codebase.
- Create a public Storage bucket if review photo upload is wanted.
- `docs/SECURITY.md` records outstanding rotations: the `service_role` key, the
  `sb_secret_…` key and three GitHub PATs, all previously exposed in a chat
  session and to be treated as compromised. The anon key does not need rotating.

### Android configuration

- Host `https://weddingmall.online/.well-known/assetlinks.json` with the release
  signing certificate's SHA-256 fingerprint, or App Links will fall back to the
  disambiguation dialog.
- Release keystore and its credentials are held by the owner; the signed
  APK/AAB are deliberately not in the repo.

### iOS configuration

- Enable the **Associated Domains** capability in Xcode with
  `applinks:weddingmall.online` and `applinks:www.weddingmall.online`.
- Host `https://weddingmall.online/.well-known/apple-app-site-association`
  (JSON, no extension, served as `application/json`) with the team ID and bundle
  id `online.weddingmall.app`.
- A paid Apple Developer account and a provisioning profile are required to
  build for a device or the store.

### Push notification configuration

Not wired. If push is wanted later it needs an FCM project + `google-services.json`,
an APNs auth key + the Push Notifications capability, `@capacitor/push-notifications`,
a device-token table, and a server-side sender (an Edge Function holding the
service key) — none of which can be done without the owner's credentials.

### App Store

- Bundle id `online.weddingmall.app`, display name "Wedding Mall".
- Listing copy, icons and screenshots are packaged in the repo from earlier work.
- Privacy nutrition labels must declare: contact info (name, phone, email) tied
  to enquiries, coarse location if the geocoder is enabled, and photos if review
  upload is added.

### Play Store

- Application id `online.weddingmall.app`, app name "Wedding Mall".
- Data safety form must match the same collection list as above.
- The `assetlinks.json` fingerprint must be the **Play App Signing** certificate
  if Play re-signs the upload.

### Domain / deployment

- `weddingmall.online` serves the SPA; the build also runs from a sub-path
  (`BASE_URL` feeds the router basename).
- The host must rewrite unknown paths to `index.html` or deep links 404.
- Serve both `.well-known` files over HTTPS with no redirect — both Apple and
  Google refuse a redirected association file.
