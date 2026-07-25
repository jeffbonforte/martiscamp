-- Martis Camp Families — outbound WhatsApp bookkeeping.
--
-- Records every proactive message we send so nobody is told the same thing
-- twice: an invite push, and later the "your favorites are coming up" alerts.
-- Sending is idempotent against this table, so a retried cron run or a
-- re-fired database webhook can't produce duplicate texts.
--
-- NOT YET USED. The sender (api/notify-invite.js) is gated on whether the
-- Twilio number can send Meta-approved template messages — WhatsApp only allows
-- business-initiated messages outside a 24-hour window via a template. This
-- table and the seedConversation()/rsvp_to_event work land first so that piece
-- is small when the answer comes back.

create table if not exists public.wa_notifications (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  kind        text not null check (kind in ('event_invite', 'favorite_arrival')),
  -- What the notification was about: an events.id for 'event_invite', the
  -- arriving families.id for 'favorite_arrival'.
  subject_id  uuid not null,
  -- Distinguishes repeat-worthy instances of the same subject — e.g. the same
  -- family arriving on a different date is a new notification, the same
  -- arrival re-detected tomorrow is not.
  dedupe_key  text not null,
  phone       text,                                -- as sent, for support
  sent_at     timestamptz not null default now(),
  error       text,                                -- set when the send failed
  unique (member_id, kind, dedupe_key)
);

create index if not exists wa_notifications_member_idx
  on public.wa_notifications(member_id, sent_at desc);

-- Same posture as wa_conversations: RLS on with no policies means no access for
-- anon or authenticated. Only the service_role key used by the API functions
-- can read or write. This holds phone numbers and message subjects.
alter table public.wa_notifications enable row level security;

-- Verify:
--   select kind, count(*), max(sent_at) from public.wa_notifications group by kind;
--   select * from public.wa_notifications where error is not null order by sent_at desc;
