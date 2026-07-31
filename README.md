# WeddingMall — Mobile App

The Android/iOS companion to <https://weddingmall.online/>, running on the
**same Supabase project** (`lwkrpweahafcaxcmseys`). No second database, no
duplicated source of truth: anything the website admin changes appears in the app,
and enquiries sent from the app land in the same `leads` inbox.

**Stack:** React 19 + TypeScript + Vite · Tailwind v4 design tokens ·
TanStack Query · Supabase JS · Capacitor (Android/iOS).

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the PUBLIC url + anon key
npm run dev                    # http://localhost:5173
```

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check + production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint |
| `npm test` | Vitest |

> **Security:** only `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (anon)
> belong in the client. The app **refuses to boot** if a `service_role`/secret key
> is detected in a `VITE_` variable. See [docs/SECURITY.md](docs/SECURITY.md).

## Roles

| Role | Auth | Can do |
|---|---|---|
| **Customer** | *none — guest* | Browse, search, filter, shortlist (on-device), send enquiries |
| **Vendor** | Supabase **email + password** | Everything above, plus their own listing summary and enquiries |
| **Admin** | — | Stays on the website; the app reflects admin changes on next fetch |

Customers need no account because the backend has no customer/profiles table and
the website captures enquiries anonymously. Phone/OTP auth is **disabled** on this
Supabase project (`phone: false`), so vendors sign in by email.

## Architecture

```
src/
  services/            all data access (the only place that talks to Supabase)
    supabase/client.ts   single client + typed ServiceError
    vendors.ts           search/filter/sort/paginate, detail, my-vendor
    leads.ts             enquiry create + vendor's own leads
    content.ts           locations, popular cities, blogs, jobs
    auth.ts              email sign-in, reset, update password
    favourites.ts        on-device shortlist (no table exists)
  auth/SessionContext   session restore + auth state
  hooks/                useCity, useFavourites, useDebounced
  routes/couple/        Home, Explore, VendorDetail, Enquiry, Favourites,
                        CitySelector, Blogs, Careers, Privacy, Terms, Profile
  routes/vendor/        Dashboard, Leads
  routes/auth/          Splash, VendorLogin, ResetPassword
  components/           VendorCard, CategoryTile, LeadRow, GalleryLightbox, ui/
  types/domain.ts       mirrors the REAL schema only
```

**Data flow:** UI → `services/*` → Supabase. Components never build queries or
touch table names directly, so a schema change is a one-file edit.

**Freshness:** TanStack Query caches with short stale times; vendor enquiries
refetch on window focus so website-submitted leads appear without a restart.

## Docs

- [docs/SCHEMA.md](docs/SCHEMA.md) — real schema + screen→table mapping
- [docs/SECURITY.md](docs/SECURITY.md) — RLS evidence, key rotation, hardening SQL
- [docs/MOBILE.md](docs/MOBILE.md) — Android & iOS build/release instructions
