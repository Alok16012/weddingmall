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
