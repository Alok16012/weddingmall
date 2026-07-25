# WeddingMall

India's premium multi-vendor wedding marketplace — an Android-first, mobile web app
serving **Couples** and **Vendors** in one role-aware shell. Built by **Blinks AI**.

Stack: **React 19 + TypeScript + Vite**, **Tailwind v4** design tokens,
**React Query** for server state, **Supabase** (Auth/Postgres/Realtime/Storage) via a
typed repository layer, packaged for Android with **Capacitor**.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the PUBLIC Supabase URL + publishable key
npm run dev                  # http://localhost:5173
```

Only the public `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` belong in the
client. The service/secret key must never be placed in a `VITE_` variable — the app
refuses to boot (`assertNoSecretKey`) if it detects one.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint |
| `npm test` | Vitest unit suite |
| `npm run test:coverage` | Coverage report |

## Data source

`VITE_DATA_SOURCE` selects the repository backend:

- `fixtures` (default) — deterministic in-memory data; the whole app is navigable
  without a backend.
- `supabase` — real backend (apply `supabase/migrations/*` first — see
  [`supabase/README.md`](supabase/README.md)).

## Structure

```
src/
  assets/brand/        WeddingMall + Blinks AI logos
  auth/                session & role context (role switch, no 2nd account)
  components/          UI primitives, VendorCard, Brand, layout (shell + bottom nav)
  hooks/               useFavourites (optimistic shortlist)
  lib/                 supabase client, env guard, formatters, query client
  repositories/        typed data contracts + fixtures (UI never touches tables)
  routes/couple/       Home, Explore, Detail, Enquiry, Favourites, Bookings, Chat, …
  routes/vendor/       Dashboard, Listings, Leads, Calendar, Account
  types/               domain model (spec §9)
supabase/migrations/   schema + RLS + rollback
docs/                  production-readiness scorecard
```

See [`docs/production-readiness-scorecard.md`](docs/production-readiness-scorecard.md)
for the live quality score and hard-gate status.
