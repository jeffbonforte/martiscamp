-- Martis Camp Families — WhatsApp assistant state.
--
-- Promotes docs/wa-conversations.sql into migrations/ so a rebuild from this
-- directory doesn't silently lose conversation memory, and adds the nudge
-- throttle used by the assistant's "are you up for Thanksgiving?" prompt.
--
-- Idempotent: safe to run on the live database, where the table already exists.

create table if not exists public.wa_conversations (
  phone      text primary key,                    -- last 10 digits of the member's phone
  turns      jsonb not null default '[]'::jsonb,  -- recent [{role, content}] text turns
  updated_at timestamptz not null default now()
);

-- When we last offered to add this person's days. Throttled in code (see
-- api/_lib/agent.js) so the assistant asks at most once a week per person —
-- a prompt rule is a suggestion, a timestamp is a fact.
alter table public.wa_conversations
  add column if not exists last_nudge_at timestamptz;

-- RLS on with no policies = no access for anon/authenticated. The webhook uses
-- the service_role key, which bypasses RLS. This table holds message content,
-- so it must never be reachable from the browser.
alter table public.wa_conversations enable row level security;

-- Verify:
--   select phone, jsonb_array_length(turns) as turns, updated_at, last_nudge_at
--     from public.wa_conversations order by updated_at desc limit 10;
