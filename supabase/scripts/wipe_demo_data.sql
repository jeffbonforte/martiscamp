-- One-off ops script: wipe all seeded DEMO data from the live database so real
-- families aren't confused by fake families/events/attendance, while keeping
-- the owner (jeff@bonforte.com) able to sign in and stay an admin.
--
-- NOT a migration (don't renumber it) — run manually in the Supabase SQL Editor.
-- The original demo data lives in migrations/0003_seed.sql if it's ever needed
-- again. Storage is untouched (no real uploads yet).

begin;

-- 1) Clear every content table. CASCADE handles all FK children of families
--    (members, attendance, events, rsvps, event_invites, comments, favorites,
--    feed_reads); the rest are listed explicitly.
truncate table
  public.attendance,
  public.rsvps,
  public.event_invites,
  public.comments,
  public.events,
  public.favorites,
  public.feed_reads,
  public.feed,
  public.community_calendar,
  public.members,
  public.families,
  public.invites,
  public.admin_actions
restart identity cascade;

-- 2) Re-create the owner's family shell + admin member, re-linked to the
--    existing auth user by email (so jeff keeps admin access immediately, no
--    re-login needed). Jeff can edit/rename this and add real members in-app.
insert into public.families (slug, name, tone)
values ('bonforte', 'Bonforte', 'var(--lake-600)');

insert into public.members (family_id, name, role, email, is_account, is_admin, user_id)
select f.id, 'Jeff Bonforte', 'Parent', 'jeff@bonforte.com', true, true, u.id
from public.families f
left join auth.users u on lower(u.email) = lower('jeff@bonforte.com')
where f.slug = 'bonforte';

-- 3) Keep jeff on the sign-in allowlist.
insert into public.invites (email, family_id, accepted_at)
select 'jeff@bonforte.com', f.id, now()
from public.families f
where f.slug = 'bonforte';

commit;

-- Sanity checks (run after committing):
--   select count(*) from public.families;  -- expect 1
--   select name, email, is_admin, user_id is not null as linked from public.members;
--   select email, accepted_at from public.invites;
