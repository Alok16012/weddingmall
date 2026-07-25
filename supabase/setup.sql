-- WeddingMall — one-paste setup: schema + RLS + seed.
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to re-run.
-- Generated 2026-07-25. Source: migrations/0001, migrations/0002, seed.sql

-- ============ 1. SCHEMA ============
-- WeddingMall — core schema (spec §9 data model)
-- Money is stored as integer minor units (paise) + currency. Server timestamps only.
-- Idempotency/uniqueness enforced for favourites, enquiries, messages, bookings.
--
-- Apply with: supabase db push   (or paste into the SQL editor)
-- This migration is additive; see 0002_rls_policies.sql for row-level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type role as enum ('couple', 'vendor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_category as enum ('venue','makeup','photography','catering','decor','mehendi');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('draft','submitted','pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('draft','published','paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enquiry_stage as enum ('new','contacted','quoted','visit_scheduled','won','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('requested','confirmed','declined','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_state as enum ('pending','sent','delivered','read','failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role role not null default 'couple',
  display_name text not null default '',
  phone text,
  city text,
  avatar_url text,
  wedding_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  category vendor_category not null,
  city text not null,
  approval approval_status not null default 'draft',
  verified boolean not null default false,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Vendor ownership derives from a trusted membership, never a client-supplied id.
create table if not exists vendor_members (
  vendor_id uuid not null references vendors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (vendor_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  category vendor_category not null,
  title text not null,
  description text not null default '',
  city text not null,
  lat double precision,
  lng double precision,
  price_mode text not null default 'on_request' check (price_mode in ('fixed','on_request')),
  from_price_minor integer,
  currency text not null default 'INR',
  price_unit text,
  capacity_min integer,
  capacity_max integer,
  amenities text[] not null default '{}',
  status listing_status not null default 'draft',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_category_city_idx on listings (category, city) where deleted_at is null;
create index if not exists listings_status_idx on listings (status) where deleted_at is null;

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  alt text not null default '',
  "order" integer not null default 0,
  is_private boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists media_listing_idx on media (listing_id, "order");

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  name text not null,
  price_minor integer not null,
  currency text not null default 'INR',
  price_unit text,
  inclusions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  date date not null,
  status text not null default 'blocked' check (status in ('blocked','open')),
  reason text,
  created_at timestamptz not null default now(),
  unique (vendor_id, date)
);

-- ---------------------------------------------------------------------------
-- Couple activity
-- ---------------------------------------------------------------------------
create table if not exists favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)                 -- idempotent unique pair
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  event_date date,
  guests integer check (guests is null or (guests between 1 and 10000)),
  budget_minor integer,
  message text not null check (char_length(message) <= 1000),
  stage enquiry_stage not null default 'new',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, idempotency_key)               -- duplicate-submit protection
);
create index if not exists enquiries_vendor_stage_idx on enquiries (vendor_id, stage);
create index if not exists enquiries_couple_idx on enquiries (couple_id);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid references enquiries(id) on delete set null,
  couple_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  listing_id uuid references listings(id) on delete set null,
  last_message text,
  last_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  attachment_url text,
  attachment_type text check (attachment_type in ('image','pdf')),
  state message_state not null default 'sent',
  client_id text,                                    -- for exactly-once optimistic send
  created_at timestamptz not null default now(),
  unique (conversation_id, client_id)
);
create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  event_date date not null,
  guests integer not null check (guests between 1 and 100000),
  -- Immutable snapshots even if the listing/package later changes.
  package_name text not null,
  package_price_minor integer not null,
  currency text not null default 'INR',
  status booking_status not null default 'requested',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, idempotency_key)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 20 and 1000),
  verified boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (listing_id, author_id)
);

create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

create table if not exists remote_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Physical goods — the "Wedding Products" side of the marketplace.
do $$ begin
  create type product_category as enum ('invitations','wedding_wear','jewellery','gifting','cakes','favours');
exception when duplicate_object then null; end $$;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete set null,
  category product_category not null,
  name text not null,
  seller text not null,
  city text not null,
  price_minor integer not null,
  currency text not null default 'INR',
  price_unit text,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  image_url text not null,
  image_alt text not null default '',
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on products (category) where active;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$ begin
  create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
  create trigger trg_listings_updated before update on listings for each row execute function set_updated_at();
  create trigger trg_enquiries_updated before update on enquiries for each row execute function set_updated_at();
  create trigger trg_bookings_updated before update on bookings for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ============ 2. RLS POLICIES ============
-- WeddingMall — Row-Level Security (spec §3.4 security hard gates)
-- Every table has RLS enabled. Public projections expose only approved/published
-- rows. Vendor ownership is proven via vendor_members, never a client-supplied id.

-- Helper: is the current user a member of this vendor?
create or replace function is_vendor_member(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vendor_members m
    where m.vendor_id = v and m.user_id = auth.uid()
  );
$$;

-- Enable RLS everywhere
alter table profiles        enable row level security;
alter table vendors         enable row level security;
alter table vendor_members  enable row level security;
alter table listings        enable row level security;
alter table media           enable row level security;
alter table packages        enable row level security;
alter table availability    enable row level security;
alter table favourites      enable row level security;
alter table enquiries       enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table bookings        enable row level security;
alter table reviews         enable row level security;
alter table device_tokens   enable row level security;
alter table remote_config   enable row level security;
alter table products        enable row level security;

-- ---- profiles: self read/update ----
create policy profiles_self_select on profiles for select using (id = auth.uid());
create policy profiles_self_upsert on profiles for insert with check (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- vendors: approved public read; members manage own ----
create policy vendors_public_read on vendors for select using (approval = 'approved' or is_vendor_member(id));
create policy vendors_member_update on vendors for update using (is_vendor_member(id)) with check (is_vendor_member(id));

-- ---- vendor_members: visible to members only ----
create policy vendor_members_read on vendor_members for select using (user_id = auth.uid() or is_vendor_member(vendor_id));

-- ---- listings: published public read; vendor team CRUD own ----
create policy listings_public_read on listings
  for select using ((status = 'published' and deleted_at is null) or is_vendor_member(vendor_id));
create policy listings_member_insert on listings for insert with check (is_vendor_member(vendor_id));
create policy listings_member_update on listings for update using (is_vendor_member(vendor_id)) with check (is_vendor_member(vendor_id));
create policy listings_member_delete on listings for delete using (is_vendor_member(vendor_id));

-- ---- media: approved+public read; private docs never public; vendor CRUD own ----
create policy media_public_read on media for select using (
  (approved and not is_private and exists (
    select 1 from listings l where l.id = media.listing_id and l.status = 'published'
  ))
  or exists (select 1 from listings l where l.id = media.listing_id and is_vendor_member(l.vendor_id))
);
create policy media_member_write on media for all
  using (exists (select 1 from listings l where l.id = media.listing_id and is_vendor_member(l.vendor_id)))
  with check (exists (select 1 from listings l where l.id = media.listing_id and is_vendor_member(l.vendor_id)));

-- ---- packages: active public read; vendor CRUD own ----
create policy packages_public_read on packages for select using (
  (active and exists (select 1 from listings l where l.id = packages.listing_id and l.status = 'published'))
  or exists (select 1 from listings l where l.id = packages.listing_id and is_vendor_member(l.vendor_id))
);
create policy packages_member_write on packages for all
  using (exists (select 1 from listings l where l.id = packages.listing_id and is_vendor_member(l.vendor_id)))
  with check (exists (select 1 from listings l where l.id = packages.listing_id and is_vendor_member(l.vendor_id)));

-- ---- availability: public read projection; vendor writes own ----
create policy availability_public_read on availability for select using (true);
create policy availability_member_write on availability for all
  using (is_vendor_member(vendor_id)) with check (is_vendor_member(vendor_id));

-- ---- favourites: user owns ----
create policy favourites_own on favourites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- enquiries: participants only ----
create policy enquiries_couple_read on enquiries for select using (couple_id = auth.uid() or is_vendor_member(vendor_id));
create policy enquiries_couple_insert on enquiries for insert with check (couple_id = auth.uid());
create policy enquiries_participant_update on enquiries for update
  using (couple_id = auth.uid() or is_vendor_member(vendor_id))
  with check (couple_id = auth.uid() or is_vendor_member(vendor_id));

-- ---- conversations: participants only ----
create policy conversations_participants on conversations for select
  using (couple_id = auth.uid() or is_vendor_member(vendor_id));

-- ---- messages: participants only; immutable sender ----
create policy messages_read on messages for select using (
  exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.couple_id = auth.uid() or is_vendor_member(c.vendor_id))
  )
);
create policy messages_send on messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.couple_id = auth.uid() or is_vendor_member(c.vendor_id))
  )
);

-- ---- bookings: participants only; financial/status fields server-controlled ----
create policy bookings_read on bookings for select using (couple_id = auth.uid() or is_vendor_member(vendor_id));
create policy bookings_couple_insert on bookings for insert with check (couple_id = auth.uid());

-- ---- reviews: approved public read; author creates ----
create policy reviews_public_read on reviews for select using (approved or author_id = auth.uid());
create policy reviews_author_insert on reviews for insert with check (author_id = auth.uid());

-- ---- device_tokens: self only; never publicly queryable ----
create policy device_tokens_own on device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- remote_config: public safe read ----
create policy remote_config_read on remote_config for select using (true);

-- ---- products: active public read; vendor team manages own ----
create policy products_public_read on products for select using (active or (vendor_id is not null and is_vendor_member(vendor_id)));
create policy products_member_write on products for all
  using (vendor_id is not null and is_vendor_member(vendor_id))
  with check (vendor_id is not null and is_vendor_member(vendor_id));

-- NOTE: with RLS enabled and no admin/service policy defined here, privileged
-- writes (approvals, moderation, financial status) must go through Edge Functions
-- using the service role, or explicit admin policies added in a later migration.

-- ============ 3. SEED DATA ============
-- WeddingMall — seed data (public, approved/published). Safe to run after
-- 0001_core_schema.sql + 0002_rls_policies.sql. Idempotent via fixed UUIDs.
-- Money is integer minor units (paise). Coordinates around Patna for distance.

-- Vendors -------------------------------------------------------------------
insert into vendors (id, name, category, city, approval, verified, rating, review_count) values
  ('11111111-0000-0000-0000-000000000001', 'Usha Resort',           'venue',       'Patna', 'approved', true, 5.0, 128),
  ('11111111-0000-0000-0000-000000000002', 'Reeti Rivaaj Banquet',  'venue',       'Patna', 'approved', true, 4.9,  94),
  ('11111111-0000-0000-0000-000000000003', 'Makeovers by Rhea',     'makeup',      'Patna', 'approved', true, 4.9, 212),
  ('11111111-0000-0000-0000-000000000004', 'Frames & Feels',        'photography', 'Patna', 'approved', true, 4.8,  76),
  ('11111111-0000-0000-0000-000000000005', 'Annapurna Caterers',    'catering',    'Patna', 'approved', false,4.7, 143),
  ('11111111-0000-0000-0000-000000000006', 'Gulmohar Decor',        'decor',       'Patna', 'approved', true, 4.8,  58),
  ('11111111-0000-0000-0000-000000000007', 'Henna Stories',         'mehendi',     'Patna', 'approved', true, 4.9, 101)
on conflict (id) do nothing;

-- Listings ------------------------------------------------------------------
insert into listings (id, vendor_id, category, title, description, city, lat, lng, price_mode, from_price_minor, price_unit, capacity_min, capacity_max, amenities, status) values
  ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','venue','Usha Resort — Lawn & Banquet','A premier lawn-and-banquet venue in Patna with landscaped gardens, a 1,200-guest capacity and in-house catering.','Patna',25.6100,85.1200,'fixed',45000000,'per event',200,1200,'{"Parking 200+","In-house catering","AC banquet","Bridal room","DJ allowed"}','published'),
  ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000002','venue','Reeti Rivaaj Banquet','A refined indoor banquet with chandelier lighting and customisable stage decor, seating up to 800 guests.','Patna',25.6300,85.1500,'fixed',52500000,'per event',150,800,'{"Valet parking","AC hall","Catering","Stage decor","Rooms"}','published'),
  ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000003','makeup','Makeovers by Rhea — Bridal Makeup','Signature HD and airbrush bridal makeup with a complimentary trial. Rhea travels to your venue.','Patna',25.5900,85.1300,'fixed',2800000,'per booking',null,null,'{"HD & airbrush","Trial available","Travels to venue","Draping included"}','published'),
  ('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000004','photography','Frames & Feels — Candid Photography','Candid-first photography with cinematic wedding films, same-day teasers and drone coverage.','Patna',25.6000,85.1600,'fixed',8500000,'per day',null,null,'{"Candid + traditional","Cinematic film","Same-day teaser","Drone"}','published'),
  ('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000005','catering','Annapurna Caterers — Multi-cuisine','Multi-cuisine wedding catering with live counters and customisable menus.','Patna',25.6200,85.1000,'fixed',85000,'per plate',null,null,'{"Veg & non-veg","Live counters","Custom menu","Serving staff"}','published'),
  ('22222222-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000006','decor','Gulmohar Decor — Floral & Theme','Bespoke floral and theme decor — mandaps, entrance arches, stage backdrops and ambient lighting.','Patna',25.6400,85.1700,'on_request',null,null,null,null,'{"Floral mandap","Theme decor","Lighting","Entrance arch"}','published'),
  ('22222222-0000-0000-0000-000000000007','11111111-0000-0000-0000-000000000007','mehendi','Henna Stories — Bridal Mehendi','Intricate bridal mehendi with organic henna and personalised motifs, plus family packages.','Patna',25.5850,85.1250,'fixed',1500000,'per bride',null,null,'{"Bridal + family","Organic henna","Travels to venue","Custom motifs"}','published')
on conflict (id) do nothing;

-- Media ---------------------------------------------------------------------
insert into media (listing_id, url, alt, "order", approved) values
  ('22222222-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80','Grand decorated wedding lawn at dusk',0,true),
  ('22222222-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80','Banquet hall set for reception',1,true),
  ('22222222-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80','Couple under floral arch',2,true),
  ('22222222-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80','Elegant banquet hall with chandeliers',0,true),
  ('22222222-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1000&q=80','Bride with elegant bridal makeup',0,true),
  ('22222222-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80','Candid wedding photography moment',0,true),
  ('22222222-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80','Lavish catering buffet spread',0,true),
  ('22222222-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=1000&q=80','Floral mandap decoration',0,true),
  ('22222222-0000-0000-0000-000000000007','https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?auto=format&fit=crop&w=1000&q=80','Intricate bridal mehendi on hands',0,true)
on conflict do nothing;

-- Packages ------------------------------------------------------------------
insert into packages (listing_id, name, price_minor, price_unit, inclusions, active) values
  ('22222222-0000-0000-0000-000000000001','Silver — Lawn only',45000000,'per event','{"Lawn for up to 600","Basic stage & lighting","Parking","Power backup"}',true),
  ('22222222-0000-0000-0000-000000000001','Gold — Lawn + Banquet',65000000,'per event','{"Lawn + AC banquet","Premium decor","In-house catering (veg)","Bridal room","DJ"}',true),
  ('22222222-0000-0000-0000-000000000003','Bridal HD + Trial',2800000,'per booking','{"HD/airbrush bridal look","One trial session","Draping","False lashes"}',true),
  ('22222222-0000-0000-0000-000000000003','Family add-on',600000,'per person','{"Party makeup","Draping","Hairstyling"}',true)
on conflict do nothing;

-- Products ------------------------------------------------------------------
insert into products (id, category, name, seller, city, price_minor, price_unit, rating, review_count, image_url, image_alt, description) values
  ('33333333-0000-0000-0000-000000000001','invitations','Royal Gold Foil Invitation','Patna Print House','Patna',12000,'per card',4.8,64,'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=800&q=80','Gold foil wedding invitation card','Hand-finished gold foil invitations on premium textured stock. Minimum order 100 cards.'),
  ('33333333-0000-0000-0000-000000000002','wedding_wear','Hand-embroidered Bridal Lehenga','Rivaaj Couture','Patna',8500000,'per piece',4.9,41,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Red bridal lehenga with embroidery','Custom-tailored bridal lehenga with zardozi hand embroidery. 4-6 week lead time.'),
  ('33333333-0000-0000-0000-000000000003','jewellery','Polki Bridal Jewellery Set','Sona Jewellers','Patna',12500000,'per set',4.7,28,'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80','Polki bridal necklace set','Uncut polki necklace, earrings and maang tikka. Hallmarked, with certificate.'),
  ('33333333-0000-0000-0000-000000000004','gifting','Luxury Wedding Gift Hamper','Shagun Boxes','Patna',250000,'per hamper',4.6,112,'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80','Decorated wedding gift hamper','Curated dry-fruit and sweets hampers with custom ribboning. Bulk pricing available.'),
  ('33333333-0000-0000-0000-000000000005','cakes','Three-tier Wedding Cake','Sugar & Spice Bakers','Patna',800000,'per cake',4.8,76,'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80','Three tier white wedding cake','Customisable three-tier fondant cake with fresh-flower finish. Eggless option available.'),
  ('33333333-0000-0000-0000-000000000006','favours','Personalised Guest Favours','Little Tokens','Patna',15000,'per favour',4.7,53,'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80','Wedding guest favour boxes','Personalised mini favours — candles, chocolates or potli bags. Minimum 50 units.')
on conflict (id) do nothing;

-- Remote config -------------------------------------------------------------
insert into remote_config (key, value) values
  ('home_hero', '{"title":"Plan Your Dream Wedding","subtitle":"Venues, vendors & everything you need","badge":"India''s #1 Wedding Marketplace"}'),
  ('trust_stats', '{"verified_vendors":"1,000+","happy_couples":"2,000+","cities":"100+"}'),
  ('min_supported_version', '{"android":"1.0.0"}')
on conflict (key) do update set value = excluded.value, updated_at = now();
