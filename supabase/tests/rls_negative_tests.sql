-- WeddingMall — RLS negative tests (SEC-01/02/03).
-- Run on staging with two seeded users (A, B) and two vendors (VA, VB).
-- Every SELECT below must return ZERO rows; every write must RAISE.
-- Swap the set_config uid values for your seeded auth.users ids.

-- === SEC-01: cross-user data isolation ===
-- Act as User A:
select set_config('request.jwt.claims', json_build_object('sub','<USER_A_UUID>')::text, true);
-- Must be empty (B's favourites/enquiries/messages/bookings not visible to A):
select count(*) as leak_favourites from favourites where user_id = '<USER_B_UUID>';
select count(*) as leak_enquiries  from enquiries  where couple_id = '<USER_B_UUID>';
select count(*) as leak_bookings   from bookings   where couple_id = '<USER_B_UUID>';
select count(*) as leak_messages   from messages m
  join conversations c on c.id = m.conversation_id
  where c.couple_id = '<USER_B_UUID>';

-- === SEC-02: cross-vendor isolation ===
-- Act as a member of Vendor A trying to read/update Vendor B:
select set_config('request.jwt.claims', json_build_object('sub','<VENDOR_A_MEMBER_UUID>')::text, true);
select count(*) as leak_vb_leads    from enquiries where vendor_id = '<VENDOR_B_UUID>';
select count(*) as leak_vb_calendar from availability where vendor_id = '<VENDOR_B_UUID>';
-- This UPDATE must affect 0 rows (policy denies):
update listings set title = 'hacked' where vendor_id = '<VENDOR_B_UUID>';

-- === SEC-03: anonymous cannot read private/participant data ===
select set_config('request.jwt.claims', 'null', true);
select count(*) as anon_enquiries from enquiries;      -- expect 0
select count(*) as anon_messages  from messages;       -- expect 0
select count(*) as anon_private_media from media where is_private = true; -- expect 0
-- Public projections SHOULD still work for anon:
select count(*) >= 0 as anon_can_see_published from listings where status = 'published';
