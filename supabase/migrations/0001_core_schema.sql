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
