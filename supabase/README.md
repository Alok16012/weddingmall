# WeddingMall — Supabase backend

The live project (`lspcgrcmftededbushvp`) was **empty** at project start (0 tables,
0 users, 0 buckets). These migrations create the schema and RLS from scratch,
aligned to the domain model in `src/types/domain.ts`.

## Apply

> ⚠️ Schema changes are hard to reverse. Take a backup / run on staging first.
> These are **not** auto-applied by the app — apply them deliberately.

Option A — Supabase CLI (recommended):

```bash
supabase link --project-ref lspcgrcmftededbushvp
supabase db push
```

Option B — SQL editor: paste `migrations/0001_core_schema.sql` then
`migrations/0002_rls_policies.sql` in order.

After applying, flip the app to the real backend:

```
# .env.local
VITE_DATA_SOURCE=supabase
```

## Rollback

```bash
psql "$DATABASE_URL" -f migrations/9999_rollback.sql
```

## Security model (spec §3.4)

- **RLS on every table.** No table is readable/writable without a matching policy.
- **Vendor ownership** is proven via `vendor_members` + `is_vendor_member()`,
  never a client-supplied `vendor_id`.
- **Public projections** expose only `approved` vendors / `published` listings /
  `approved` non-private media / `approved` reviews.
- **Private documents** (`media.is_private`) are never exposed by the public policy.
- **Privileged writes** (approvals, moderation, booking financial status) are *not*
  granted to end users here — they must run through an Edge Function using the
  service role, or an explicit admin policy in a later migration.

## RLS negative tests (SEC-01 / SEC-02 / SEC-03)

See `tests/rls_negative_tests.sql`. Each asserts a **denial**:

- SEC-01 — User A cannot read User B's favourites / enquiries / messages / bookings.
- SEC-02 — Vendor A cannot read/update Vendor B's listing / lead / calendar.
- SEC-03 — Anonymous cannot read enquiries/messages or enumerate private media.

Run against a staging DB with two seeded users; every SELECT in the file must
return **zero rows** (or the write must raise), proving the policy denies access.
