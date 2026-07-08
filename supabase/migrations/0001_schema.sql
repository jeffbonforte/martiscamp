-- Martis Camp Families — schema
-- Data model per design_handoff/BACKEND_SPEC.md. Postgres / Supabase.
-- All ids are uuid; every table has created_at (+ updated_at where it mutates).

create extension if not exists "pgcrypto";

-- updated_at helper -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- families ----------------------------------------------------------------
create table if not exists public.families (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,                       -- stable key (e.g. 'bonforte')
  name            text not null,                     -- "Bonforte" → UI renders "The Bonfortes"
  address         text,
  hometown        text,
  cover_photo_url text,                              -- resolved URL or a bundled cover name
  tone            text,                              -- brand hue token for fallbacks
  home_lot        text,
  archived_at     timestamptz,                       -- soft delete
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- members -----------------------------------------------------------------
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  name        text not null,
  role        text,                                  -- "Parent" | "Kid · 14" | free text
  photo_url   text,
  phone       text,
  email       text,
  interests   text[] not null default '{}',          -- amenity keys
  tone        text,
  is_account  boolean not null default false,         -- can this member sign in?
  is_admin    boolean not null default false,
  user_id     uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists members_family_idx on public.members(family_id);
create index if not exists members_user_idx   on public.members(user_id);

-- attendance — the core "who's here" table, one row per member per date ----
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.members(id) on delete cascade,
  family_id  uuid not null references public.families(id) on delete cascade, -- denormalized
  date       date not null,
  status     text not null default 'planned' check (status in ('planned','confirmed')),
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, date)
);
create index if not exists attendance_date_idx   on public.attendance(date);
create index if not exists attendance_family_idx on public.attendance(family_id, date);

-- events — member-organized get-togethers ---------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  title           text not null,
  amenity         text,
  host_member_id  uuid references public.members(id) on delete set null,
  starts_at       timestamptz,
  when_label      text,                              -- human string e.g. "Sat, Jul 12 · 8:30 AM"
  location        text,
  description     text,
  cover_photo_url text,
  visibility      text not null default 'open' check (visibility in ('open','private')),
  capacity        int,                               -- null = open house / no cap
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events(starts_at);

-- event_invites — who was invited to a private get-together ----------------
create table if not exists public.event_invites (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  invited_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

-- rsvps -------------------------------------------------------------------
create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  status     text not null check (status in ('going','maybe','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);
create index if not exists rsvps_event_idx on public.rsvps(event_id);

-- community_calendar — official club events -------------------------------
create table if not exists public.community_calendar (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  place        text,
  amenity      text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  day_of_month int,                                  -- convenience for the mock week
  day_key      text,                                 -- 'thu'..'wed'
  is_community boolean not null default true,
  external_id  text unique,                          -- idempotent ICS/source sync
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- comments — light social on events/families ------------------------------
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('event','family')),
  subject_id   uuid not null,
  member_id    uuid not null references public.members(id) on delete cascade,
  body         text not null,
  hidden_at    timestamptz,                          -- moderation
  created_at   timestamptz not null default now()
);
create index if not exists comments_subject_idx on public.comments(subject_type, subject_id);

-- favorites — favorites == following, family OR member --------------------
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,  -- the actor
  target_type text not null check (target_type in ('family','member')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (member_id, target_type, target_id)
);

-- feed / activity ---------------------------------------------------------
create table if not exists public.feed (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null check (kind in ('announcement','invite','arrival','gathering','rsvp','comment','community')),
  actor_member_id uuid references public.members(id) on delete set null,
  actor_label     text,                              -- display name ("The Alvarez family")
  tone            text,
  body            text not null,
  subject_type    text check (subject_type in ('event','family')),
  subject_id      uuid,
  event_slug      text,                              -- convenience link for the mock
  family_slug     text,
  created_at      timestamptz not null default now()
);
create index if not exists feed_created_idx on public.feed(created_at desc);

-- feed_reads — per-member unread tracking ---------------------------------
create table if not exists public.feed_reads (
  member_id    uuid primary key references public.members(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

-- invites — gate who may ever sign in -------------------------------------
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  family_id   uuid references public.families(id) on delete set null,
  invited_by  uuid references public.members(id) on delete set null,
  token       text unique default encode(gen_random_bytes(16),'hex'),
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- admin audit log (optional) ----------------------------------------------
create table if not exists public.admin_actions (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.members(id) on delete set null,
  action     text not null,
  subject    text,
  created_at timestamptz not null default now()
);

-- updated_at triggers -----------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['families','members','events','rsvps','community_calendar'] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%1$I;
       create trigger set_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
