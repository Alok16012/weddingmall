# WeddingMall Mobile — Security Checklist & RLS

Live-verified against `lwkrpweahafcaxcmseys` on 2026-07-31.

## 1. Key handling ✅

| Rule | Status |
|---|---|
| Only public URL + anon key in the client | ✅ `.env.local` / `.env.example` |
| App refuses to boot if a secret key is in a `VITE_` var | ✅ `assertNoSecretKey()` in `src/lib/env.ts` |
| `.env*` gitignored | ✅ |
| No secrets in logs/errors | ✅ `ServiceError` carries safe messages only |
| Single Supabase client | ✅ `src/services/supabase/client.ts` |

## 2. 🔴 OWNER ACTIONS REQUIRED — rotate these now

These were pasted into a chat session and must be treated as compromised:

1. **`service_role` key** — Supabase → Settings → API → **roll**. Highest priority: it bypasses all RLS.
2. **`sb_secret_…`** key from the older project.
3. **3 GitHub personal access tokens.**

The anon key does **not** need rotating (it is public by design).

## 3. RLS — verified live

Tested by issuing the same query with the anon key vs the service key.

| Table | anon SELECT | Verdict |
|---|---|---|
| `vendors` | 202 / 202 | ✅ public catalogue (intended) |
| `locations`, `popular_cities`, `blogs`, `jobs` | all | ✅ public content |
| **`leads`** | **0 / 22** | ✅ **private — anonymous cannot read enquiries** |

| Write attempt (anon) | Result |
|---|---|
| INSERT `leads` with a real `vendor_id` | **201 Created** — intended, powers the public enquiry form |
| INSERT `leads` with a bogus `vendor_id` | 409 FK violation — integrity enforced |
| INSERT `vendors` | **401 denied** ✅ |
| SELECT `leads` | 0 rows ✅ |

> **Implementation note.** Because anon may INSERT but not SELECT `leads`, the
> enquiry service intentionally does **not** call `.select()` after `insert()` —
> doing so fails the whole request. See `src/services/leads.ts`.

## 4. 🟠 Recommended hardening (review before running)

Anonymous `leads` INSERT is required by the public enquiry form, but it is
currently unthrottled — and 6 junk vendor rows with random names
(`fXcgtzkLjuefnyiToIOt`, …) already exist, so bot traffic is reaching the DB.

**These are proposals — nothing here has been executed. Review, then run in the
SQL editor if you agree.**

```sql
-- 1) Basic shape validation on enquiries (blocks most bot payloads)
alter table leads
  add constraint leads_phone_format
  check (customer_phone ~ '^[6-9][0-9]{9}$') not valid;

alter table leads
  add constraint leads_name_len
  check (char_length(customer_name) between 2 and 80) not valid;

-- 2) Rate-limit: at most 5 enquiries per phone per hour
create or replace function leads_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from leads
      where customer_phone = new.customer_phone
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many enquiries. Please try again later.';
  end if;
  return new;
end $$;

create trigger trg_leads_rate_limit
  before insert on leads
  for each row execute function leads_rate_limit();

-- 3) Helpful indexes for the app's queries
create index if not exists leads_vendor_created_idx on leads (vendor_id, created_at desc);
create index if not exists vendors_status_location_idx on vendors (status, location);
create index if not exists vendors_category_gin on vendors using gin (category);
```

**Storage hardening** — the `vendor-images` bucket is public with **no size limit
and no MIME restrictions**. In Supabase → Storage → `vendor-images` → Settings, set:
- File size limit: **5 MB**
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Data cleanup** — consider removing the 6 bot vendor rows and setting the 15
`pending` vendors' visibility deliberately (the app already shows only `active`).

## 5. App-side security posture

- The public app is **read-only** except for `leads` INSERT.
- Vendors authenticate with **email + password** (`phone` auth is disabled on this project).
- Vendor data access is **not** trusted from the client: the vendor's row is matched
  by their authenticated email, and `leads` visibility is enforced by RLS, not by UI code.
- No admin surface exists in the app — administration stays on the website.
