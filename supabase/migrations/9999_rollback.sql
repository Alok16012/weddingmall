-- WeddingMall — rollback for 0001/0002. Drops all app objects. Destructive.
drop function if exists is_vendor_member(uuid);
drop function if exists set_updated_at() cascade;

drop table if exists products, remote_config, device_tokens, reviews, bookings, messages,
  conversations, enquiries, favourites, availability, packages, media, listings,
  vendor_members, vendors, profiles cascade;

drop type if exists product_category, message_state, booking_status, enquiry_stage,
  listing_status, approval_status, vendor_category, role;
