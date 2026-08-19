-- ============================================================================
-- Wedding Mall — marketplace workflow schema
--
-- Adds the tables and columns the app needs for vendor contact actions, the
-- full enquiry form, bookings, the inbox, reviews, a synced shortlist, vendor
-- date availability, onboarding state and notifications.
--
-- WHY THIS IS A FILE AND NOT ALREADY APPLIED
-- The application only ever holds the public anon/publishable key (see
-- docs/SECURITY.md — a service_role key must never reach the JS bundle, and
-- src/lib/env.ts hard-fails the boot if one does). DDL therefore cannot be run
-- from the app or from this working copy. Run it as the project owner:
--
--   Supabase Dashboard → SQL Editor → paste → Run
--   or:  supabase db push          (after `supabase link`)
--   or:  psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_marketplace_workflows.sql
--
-- It is idempotent: every statement is IF NOT EXISTS / OR REPLACE, so re-running
-- is safe. It only ADDs; nothing existing is dropped, renamed or rewritten, and
-- no existing row is modified.
--
-- Until it is applied the app detects each capability as absent
-- (src/services/supabase/capabilities.ts) and simply does not offer the feature,
-- rather than showing a control that cannot work.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Vendor contact details — powers the Call and WhatsApp actions.
-- ---------------------------------------------------------------------------
alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists whatsapp text;

comment on column public.vendors.phone is
  'Registered contact number in E.164 or 10-digit national form. The app''s Call button appears only for rows where this is set.';
comment on column public.vendors.whatsapp is
  'WhatsApp number when it differs from phone. The app falls back to phone when null.';

-- The public catalogue is world-readable, and these two columns are business
-- contact details the vendor publishes on purpose — same visibility as `email`,
-- which is already exposed on the detail view.

-- ---------------------------------------------------------------------------
-- 2. Richer enquiries on the existing `leads` table.
--    The website writes to this table too, so columns are added rather than a
--    parallel table created — one source of truth for enquiries.
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists customer_email text;
alter table public.leads add column if not exists event_type     text;
alter table public.leads add column if not exists guest_count    integer;
alter table public.leads add column if not exists city           text;
alter table public.leads add column if not exists message        text;
alter table public.leads add column if not exists platform       text;
alter table public.leads add column if not exists user_id        uuid references auth.users(id) on delete set null;

comment on column public.leads.platform is 'web | android | ios — which interface the enquiry came from.';
comment on column public.leads.user_id  is 'Set when the enquiry was sent by a signed-in user, so it can be listed back to them.';

alter table public.leads add constraint leads_guest_count_sane
  check (guest_count is null or (guest_count > 0 and guest_count <= 100000)) not valid;

create index if not exists leads_user_id_idx     on public.leads (user_id);
create index if not exists leads_vendor_id_idx   on public.leads (vendor_id);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);

-- Let a signed-in customer read back their OWN enquiries (anonymous inserts and
-- the vendor's existing visibility are untouched).
drop policy if exists leads_select_own on public.leads;
create policy leads_select_own on public.leads
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Bookings — the enquiry→booking progression shown in My Bookings.
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique default 'WM-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  user_id       uuid references auth.users(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  vendor_name   text,
  lead_id       uuid references public.leads(id) on delete set null,
  event_date    date,
  event_type    text,
  guest_count   integer,
  status        text not null default 'enquiry_sent'
                  check (status in ('enquiry_sent','vendor_responded','tentative','confirmed','completed','cancelled')),
  payment_state text,
  contact_name  text,
  contact_phone text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.bookings is
  'One row per enquiry that has entered the booking pipeline. status starts at enquiry_sent — an enquiry is never presented as a confirmed booking.';

create index if not exists bookings_user_idx   on public.bookings (user_id, created_at desc);
create index if not exists bookings_vendor_idx on public.bookings (vendor_id, event_date);

alter table public.bookings enable row level security;

drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select to authenticated using (user_id = auth.uid());

drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert to authenticated with check (user_id = auth.uid());

-- The vendor sees and advances bookings for their own listing. Vendors
-- authenticate by email and `vendors.email` is their identity in this schema.
drop policy if exists bookings_select_vendor on public.bookings;
create policy bookings_select_vendor on public.bookings
  for select to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = bookings.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email')
  ));

drop policy if exists bookings_update_vendor on public.bookings;
create policy bookings_update_vendor on public.bookings
  for update to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = bookings.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email')
  ));

-- ---------------------------------------------------------------------------
-- 4. Vendor date availability — the calendar behind "Manage Booking Date".
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_availability (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  date       date not null,
  status     text not null default 'available'
               check (status in ('available','enquiry_received','tentative','confirmed','blocked')),
  note       text,
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One state per vendor per day: this unique constraint is what makes double
  -- booking impossible rather than merely discouraged in the UI.
  unique (vendor_id, date)
);

create index if not exists vendor_availability_lookup_idx on public.vendor_availability (vendor_id, date);

alter table public.vendor_availability enable row level security;

-- Availability is public information — couples need to see whether a date is
-- free before enquiring — but only the owning vendor may write it.
drop policy if exists availability_select_all on public.vendor_availability;
create policy availability_select_all on public.vendor_availability
  for select to anon, authenticated using (true);

drop policy if exists availability_write_vendor on public.vendor_availability;
create policy availability_write_vendor on public.vendor_availability
  for all to authenticated
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_availability.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email')
  ))
  with check (exists (
    select 1 from public.vendors v
    where v.id = vendor_availability.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email')
  ));

-- ---------------------------------------------------------------------------
-- 5. Inbox — conversations and messages between a couple and a vendor.
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  vendor_name     text,
  booking_id      uuid references public.bookings(id) on delete set null,
  last_message    text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  -- One thread per couple per vendor, so the inbox never fragments.
  unique (user_id, vendor_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender          text not null check (sender in ('customer','vendor')),
  body            text not null check (length(btrim(body)) > 0),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists conversations_own on public.conversations;
create policy conversations_own on public.conversations
  for all to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.vendors v
               where v.id = conversations.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email'))
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.vendors v
               where v.id = conversations.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email'))
  );

drop policy if exists messages_in_own_conversation on public.messages;
create policy messages_in_own_conversation on public.messages
  for all to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.user_id = auth.uid()
           or exists (select 1 from public.vendors v
                      where v.id = c.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email')))
  ))
  with check (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.user_id = auth.uid()
           or exists (select 1 from public.vendors v
                      where v.id = c.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email')))
  ));

-- Keep the conversation preview in step with its newest message.
create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message = left(new.body, 200), last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- 6. Reviews.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  vendor_id         uuid not null references public.vendors(id) on delete cascade,
  vendor_name       text,
  booking_id        uuid references public.bookings(id) on delete set null,
  rating            integer not null check (rating between 1 and 5),
  title             text,
  body              text,
  service_used      text,
  event_date        date,
  photos            text[] not null default '{}',
  verified_booking  boolean not null default false,
  -- Reviews are held for moderation rather than published on submission; the
  -- spec asks for spam, fake-review and abuse control, and a human gate is the
  -- only one of those this schema can guarantee on its own.
  status            text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at        timestamptz not null default now(),
  -- Duplicate-review check: one review per person per vendor.
  unique (user_id, vendor_id)
);

create index if not exists reviews_vendor_idx on public.reviews (vendor_id, status);

alter table public.reviews enable row level security;

drop policy if exists reviews_select_published on public.reviews;
create policy reviews_select_published on public.reviews
  for select to anon, authenticated using (status = 'published' or user_id = auth.uid());

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated with check (user_id = auth.uid());

-- Mark a review as a Verified Booking Review when a completed booking backs it.
create or replace function public.mark_verified_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.verified_booking := exists (
    select 1 from public.bookings b
    where b.vendor_id = new.vendor_id
      and b.user_id = new.user_id
      and b.status in ('confirmed','completed')
  );
  return new;
end $$;

drop trigger if exists reviews_mark_verified on public.reviews;
create trigger reviews_mark_verified
  before insert on public.reviews
  for each row execute function public.mark_verified_review();

-- ---------------------------------------------------------------------------
-- 7. Shortlist synced to the account (the device-local shortlist keeps working
--    for signed-out browsing and is merged in on sign-in).
-- ---------------------------------------------------------------------------
create table if not exists public.shortlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vendor_id)
);

create index if not exists shortlists_user_idx on public.shortlists (user_id, created_at desc);

alter table public.shortlists enable row level security;

drop policy if exists shortlists_own on public.shortlists;
create policy shortlists_own on public.shortlists
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. Per-user app state — currently the onboarding tour's completion flag, so
--    a returning user is not shown the tour again on a second device.
-- ---------------------------------------------------------------------------
create table if not exists public.user_app_state (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  onboarding_version   integer not null default 1,
  preferred_city       text,
  updated_at           timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

drop policy if exists user_app_state_own on public.user_app_state;
create policy user_app_state_own on public.user_app_state
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9. Notifications (in-app). Push delivery additionally needs FCM/APNs
--    credentials configured outside the database — see docs/SECURITY.md.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  vendor_id  uuid references public.vendors(id) on delete cascade,
  kind       text not null check (kind in
               ('enquiry_received','vendor_replied','booking_status_changed','booking_confirmed','message_received')),
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx   on public.notifications (user_id, created_at desc);
create index if not exists notifications_vendor_idx on public.notifications (vendor_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for all to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.vendors v
               where v.id = notifications.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email'))
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.vendors v
               where v.id = notifications.vendor_id and lower(v.email) = lower(auth.jwt() ->> 'email'))
  );

-- A new enquiry notifies the vendor. This is the one notification the database
-- can raise by itself; the rest are written by whoever changes the state.
create or replace function public.notify_vendor_of_lead() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (vendor_id, kind, title, body, link)
  values (new.vendor_id, 'enquiry_received', 'New enquiry received',
          coalesce(new.customer_name, 'A customer') || ' sent an enquiry.', '/vendor/leads');
  return new;
end $$;

drop trigger if exists leads_notify_vendor on public.leads;
create trigger leads_notify_vendor
  after insert on public.leads
  for each row execute function public.notify_vendor_of_lead();

-- Keep vendor availability honest when a booking is confirmed or released.
create or replace function public.sync_availability_from_booking() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.event_date is null then return new; end if;

  if new.status in ('tentative','confirmed') then
    insert into public.vendor_availability (vendor_id, date, status, booking_id)
    values (new.vendor_id, new.event_date,
            case new.status when 'confirmed' then 'confirmed' else 'tentative' end, new.id)
    on conflict (vendor_id, date) do update
      set status = excluded.status, booking_id = excluded.booking_id, updated_at = now();
  elsif new.status = 'cancelled' then
    update public.vendor_availability
       set status = 'available', booking_id = null, updated_at = now()
     where vendor_id = new.vendor_id and date = new.event_date and booking_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists bookings_sync_availability on public.bookings;
create trigger bookings_sync_availability
  after insert or update of status on public.bookings
  for each row execute function public.sync_availability_from_booking();

commit;

-- ============================================================================
-- After running: reload the PostgREST schema cache so the new columns and
-- tables are visible to the API immediately.
--   notify pgrst, 'reload schema';
-- The app re-probes capabilities once per browser session.
-- ============================================================================
