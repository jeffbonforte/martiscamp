-- Martis Camp Families — referrals from the WhatsApp assistant.
--
-- Members can already suggest someone through the app's "Request to add" dialog
-- (0010), and admins triage those in Admin → Requests. The assistant now feeds
-- the SAME queue rather than creating a parallel one, so there is one place to
-- look regardless of where a suggestion came from.
--
-- Two small changes:
--   1. add_requests gains `phone` — the assistant asks for a mobile number as an
--      optional extra, which the app's dialog never collected.
--   2. wa_notifications accepts a third kind, so the admin can be texted when a
--      suggestion arrives.
--
-- Idempotent: safe to re-run.

alter table public.add_requests
  add column if not exists phone text;

-- Widen the notification kinds. The constraint is recreated rather than altered
-- because Postgres has no "add value to CHECK" — dropping by the auto-generated
-- name and re-adding is the whole operation.
alter table public.wa_notifications
  drop constraint if exists wa_notifications_kind_check;

alter table public.wa_notifications
  add constraint wa_notifications_kind_check
  check (kind in ('event_invite', 'favorite_arrival', 'add_request'));

-- Verify:
--   select id, kind, name, email, phone, status, created_at
--     from public.add_requests order by created_at desc limit 10;
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.wa_notifications'::regclass and contype = 'c';
