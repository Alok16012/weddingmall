-- ============================================================================
-- 0002 — the remaining notification triggers.
--
-- 0001 created `notifications` and the one trigger the database could raise on
-- its own (a new enquiry notifies the vendor). The brief asks for four more
-- events, and the honest place for them is the database: a notification that
-- depends on a client remembering to write it is a notification that goes
-- missing the moment anything else touches the row — the SQL editor, a future
-- admin tool, another platform.
--
--   enquiry_received        → vendor   (0001)
--   vendor_replied          → customer (here)
--   message_received        → vendor   (here)
--   booking_status_changed  → customer (here)
--   booking_confirmed       → customer (here)
--
-- Run it exactly like 0001 — Dashboard → SQL Editor, or `supabase db push`.
-- Idempotent: every statement is CREATE OR REPLACE / DROP … IF EXISTS, and it
-- only adds behaviour; no existing row is modified.
--
-- Requires 0001 to have been applied first.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- A booking status change tells the customer — and only the customer, because
-- the vendor is the one who made the change.
-- ---------------------------------------------------------------------------
create or replace function public.notify_customer_of_booking_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null or new.status is not distinct from old.status then
    return new;
  end if;

  insert into public.notifications (user_id, kind, title, body, link)
  values (
    new.user_id,
    case when new.status = 'confirmed' then 'booking_confirmed' else 'booking_status_changed' end,
    case when new.status = 'confirmed'
         then 'Your booking is confirmed'
         else 'Your enquiry has an update' end,
    coalesce(new.vendor_name, 'The vendor') || ' set this to ' ||
      initcap(replace(new.status, '_', ' ')) ||
      coalesce(' for ' || to_char(new.event_date, 'DD Mon YYYY'), '') || '.',
    '/bookings'
  );
  return new;
end $$;

drop trigger if exists bookings_notify_customer on public.bookings;
create trigger bookings_notify_customer
  after update of status on public.bookings
  for each row execute function public.notify_customer_of_booking_status();

-- ---------------------------------------------------------------------------
-- A message notifies whichever side did not send it.
-- ---------------------------------------------------------------------------
create or replace function public.notify_of_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  conv public.conversations%rowtype;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  if new.sender = 'vendor' then
    if conv.user_id is not null then
      insert into public.notifications (user_id, kind, title, body, link)
      values (conv.user_id, 'vendor_replied',
              coalesce(conv.vendor_name, 'A vendor') || ' replied',
              left(new.body, 140), '/inbox/' || conv.id::text);
    end if;
  else
    insert into public.notifications (vendor_id, kind, title, body, link)
    values (conv.vendor_id, 'message_received', 'New message received',
            left(new.body, 140), '/vendor/leads');
  end if;
  return new;
end $$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_of_message();

commit;

-- After running:  notify pgrst, 'reload schema';
