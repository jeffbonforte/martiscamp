-- Martis Camp Families — enforce the invite allowlist at sign-up.
--
-- 0013 closed the back door: a stranger can still obtain a session, but every
-- read requires a linked members row, so they see an empty app. This closes the
-- FRONT door — an uninvited email can no longer create an auth user at all.
--
-- Supabase's "Before User Created" auth hook runs inside Postgres before the
-- auth.users row is written. Returning `{}` allows the sign-up; returning an
-- `error` object rejects it. The hook fires only on user CREATION, so everyone
-- who has already signed in once is unaffected.
--
-- Keep both layers. The hook is the front door; 0013 is the backstop that still
-- holds if the hook is ever disabled, misconfigured, or unavailable on the plan.

-- === Backfill the allowlist BEFORE the gate goes up ========================
-- 0003 seeds exactly one invite (jeff@bonforte.com). Members added through the
-- app since then got an invite automatically (ensureInvite, in src/lib/api.js),
-- but anyone inserted directly in SQL — or seeded — may have an email and no
-- invite row. Once the hook is enabled those people can never sign in.
--
-- This repairs that: every current member with an email is, by definition,
-- someone a family or an admin already put on the roster, which is exactly what
-- ensureInvite would have recorded. `on conflict do nothing` means a deliberately
-- REVOKED invite is left revoked — this only fills genuine gaps.
--
-- Run the first pre-flight query at the bottom of this file to see exactly who
-- this affects before you apply.
insert into public.invites (email, family_id)
select distinct on (lower(trim(m.email))) lower(trim(m.email)), m.family_id
  from public.members m
 where m.email is not null
   and trim(m.email) <> ''
   and m.archived_at is null
   -- Match case-insensitively. The unique index is on the raw `email` column,
   -- so `on conflict` alone would miss an existing 'Jeff@Bonforte.com' row and
   -- insert a lowercase twin — which would also silently un-revoke them.
   and not exists (
     select 1 from public.invites i
      where lower(i.email) = lower(trim(m.email))
   )
 order by lower(trim(m.email)), m.created_at
on conflict (email) do nothing;

-- === The hook ==============================================================
-- SECURITY DEFINER on purpose: the hook is invoked as `supabase_auth_admin`,
-- which is not covered by any policy on `invites` (an admin-only table), so an
-- invoker-rights function would read zero rows and reject EVERY sign-up. Running
-- as owner bypasses RLS on this one internal lookup. The revoke below keeps it
-- from becoming a public RPC — only the auth admin may call it.
create or replace function public.restrict_signup_to_invites(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  addr text := lower(trim(event -> 'user' ->> 'email'));
  denied jsonb := jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Martis Camp Families is invite-only. Please use the email address your invitation was sent to, or ask an admin to add you.'
    )
  );
begin
  if addr is null or addr = '' then
    return denied;
  end if;

  if exists (
    select 1 from public.invites
     where lower(email) = addr
       and revoked_at is null
  ) then
    return '{}'::jsonb;  -- allow
  end if;

  return denied;
end $$;

-- Only Supabase Auth may invoke this. Without the revoke, any signed-in user
-- could call it as an RPC and enumerate the allowlist one address at a time.
revoke execute on function public.restrict_signup_to_invites(jsonb) from public, anon, authenticated;
grant  execute on function public.restrict_signup_to_invites(jsonb) to supabase_auth_admin;

-- === Enable it =============================================================
-- This migration DEFINES the hook; it does not turn it on. Enable it in
--   Dashboard → Authentication → Hooks → Before User Created
-- and select the Postgres function `public.restrict_signup_to_invites`.
--
-- For local dev (supabase/config.toml):
--   [auth.hook.before_user_created]
--   enabled = true
--   uri = "pg-functions://postgres/public/restrict_signup_to_invites"
--
-- If the hook raises or the function is missing, sign-up fails closed (the
-- transaction errors) rather than silently letting anyone in.

-- === Pre-flight ============================================================
-- 1) WHO WOULD BE LOCKED OUT — run this BEFORE applying. Every row is a member
--    with an email and no usable invite; the backfill above adds them. If a row
--    here is someone you deliberately revoked, they will stay revoked (on
--    conflict do nothing) — but confirm the list looks like your community.
--      select m.name, m.email, i.revoked_at
--        from public.members m
--        left join public.invites i on lower(i.email) = lower(m.email)
--       where m.email is not null and m.archived_at is null
--         and (i.id is null or i.revoked_at is not null);
--
-- 2) The allowlist as it stands after applying:
--      select email, revoked_at is null as active from public.invites order by email;

-- === Verify (after enabling the hook in the dashboard) =====================
-- Exercise the function directly — no sign-up required:
--   select public.restrict_signup_to_invites(
--     jsonb_build_object('user', jsonb_build_object('email', 'jeff@bonforte.com')));
--     -- expect: {}
--   select public.restrict_signup_to_invites(
--     jsonb_build_object('user', jsonb_build_object('email', 'stranger@example.com')));
--     -- expect: {"error": {"http_code": 403, "message": "..."}}
--
-- Then end-to-end: request a magic link for an uninvited address. It must be
-- refused, and no new row may appear in auth.users:
--   select email, created_at from auth.users order by created_at desc limit 5;
