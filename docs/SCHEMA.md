# WeddingMall — Database Schema & Screen Mapping

**Project:** `lwkrpweahafcaxcmseys` — the *same* Supabase project that powers
<https://weddingmall.online/>. The app creates **no** tables and **no** second
source of truth. Verified by live introspection on 2026-07-31.

## Tables (6 total)

### `vendors` — 202 rows ⭐
**This table is both the vendor and the listing.** There is no separate listings table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `email` | text NOT NULL | Links the vendor to their auth account |
| `category` | text[] | Slugs — a vendor can be in many |
| `location` | text | City, matches `locations.city` |
| `price`, `price_unit` | text | **Legacy/empty on nearly all rows** |
| `veg_price`, `non_veg_price` | text | The *real* price signal, e.g. `"699/-"` |
| `description` | text | Long admin-authored copy |
| `images` | text[] | Full public URLs in `vendor-images` |
| `image` | text | Cover image |
| `rating` | numeric | **All rows are 5.0** (placeholder, not earned) |
| `status` | text | `active` 186 · `pending` 15 · `inactive` 1 |
| `badge` | text | `Preferred` 91 · `Most Preferred` 90 · `Promotional` 8 · `Budget Venue` 5 |
| `is_trending` | bool | 109 true / 93 false |
| `amenities` | jsonb | see below |
| `payment_policies` | jsonb | see below |
| `onboarding_complete` | bool | **`false` on all 202 rows — unused** |
| `created_at` | timestamptz | |

`amenities` keys: `wifi, garden, bridalRoom, diningArea, parkingArea, swimmingPool,
electricityBackup` (booleans) and `noOfHalls, noOfLawns, noOfRooms, noOfACRooms,
parkingCapacity, seatingCapacity` (**strings**, e.g. `"250-1000"`).

`payment_policies` keys: `gstIncluded` (bool), `paymentModes`, `advancePayment`,
`additionalCharges`, `cancellationPolicy`.

### `leads` — 22 rows
The enquiry mechanism, shared with the website.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `vendor_id` | uuid FK → `vendors.id` | |
| `vendor_name` | text | Denormalised |
| `customer_name`, `customer_phone` | text NOT NULL | |
| `wedding_date` | date | |
| `type` | text | App writes `"app"` so you can segment app vs website |
| `status` | text | App writes `"new"` |
| `created_at` | timestamptz | |

### `locations` — 31 · `popular_cities` — 12 · `blogs` — 2 · `jobs` — 2
`locations(state, city)` · `popular_cities(name)` ·
`blogs(title, slug, category, image, excerpt, content, author)` ·
`jobs(title, type, locations text[])`.

Top cities by vendor count: **Patna 83**, Ranchi 14, Varanasi 13, Gaya 12, Lucknow 12.

## Screen → table mapping

| Screen | Reads | Writes |
|---|---|---|
| Home | `vendors` (trending, featured), `popular_cities`, `blogs`, live category counts | — |
| Explore | `vendors` (server-side filter/sort/paginate) | — |
| Vendor detail | `vendors` (incl. `amenities`, `payment_policies`) | — |
| Gallery | `vendors.images` | — |
| Enquiry | `vendors` (name) | **`leads` INSERT** |
| Shortlist | `vendors` by id | on-device only |
| City selector | `locations`, `popular_cities` | on-device only |
| Blogs / Careers | `blogs`, `jobs` | — |
| Vendor login | Supabase Auth (email) | — |
| Vendor dashboard / enquiries | `vendors` (own row by email), `leads` (own) | — |

## Not available in this backend

These have **no table**, so the app deliberately does not fake them:
bookings · reviews (the `rating` column is static) · chat/messages · favourites
(on-device instead) · customer profiles · packages · availability calendar ·
notifications · products.

Adding any of them requires new tables + RLS — see `docs/SECURITY.md`.
