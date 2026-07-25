-- Conversation memory for the WhatsApp assistant.
-- Run once: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Until this table exists the assistant still works (memory is just off).

create table if not exists public.wa_conversations (
  phone      text primary key,               -- last 10 digits of the member's phone
  turns      jsonb not null default '[]'::jsonb,  -- recent [{role, content}] text turns
  updated_at timestamptz not null default now()
);

-- Lock it down: only the service_role key (used by /api/whatsapp) can read/write.
-- RLS on with no policies = no access for anon/authenticated; service_role bypasses RLS.
alter table public.wa_conversations enable row level security;
