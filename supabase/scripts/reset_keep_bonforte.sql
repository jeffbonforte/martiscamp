-- One-off reset (run in the Supabase SQL Editor): clear all test/demo families,
-- members, invites, requests, and shared content so you can start over with real
-- families — while KEEPING your Bonforte family, its members (and their
-- photos), your admin access, and your sign-in allowlist entry.

begin;

-- 1) Clear shared/demo content first (avoids FK conflicts when members are
--    deleted below). Bonforte family + members are untouched; their marked days
--    (attendance) are kept.
truncate table
  public.events,
  public.rsvps,
  public.event_invites,
  public.comments,
  public.community_calendar,
  public.feed,
  public.feed_reads,
  public.favorites,
  public.add_requests
restart identity cascade;

-- 2) Every family except yours → gone (cascades their members + attendance).
delete from public.families where slug <> 'bonforte';

-- 3) Invites → keep only your family's (jeff + any Bonforte members); drop all
--    others, including unassigned ones.
delete from public.invites
where family_id is distinct from (select id from public.families where slug = 'bonforte');

commit;

-- Sanity checks:
--   select slug, name from public.families;                          -- expect only 'bonforte'
--   select name, email, is_admin from public.members order by name;  -- your household
--   select email, family_id is not null as assigned from public.invites;
