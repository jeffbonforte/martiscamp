-- Martis Camp Families — show admins whether an invite actually took.
--
-- "I invited them, are they using it?" can only be answered from
-- auth.users.last_sign_in_at, which the browser cannot read: the auth schema
-- isn't exposed through PostgREST, and it holds every user's session metadata.
--
-- So: one SECURITY DEFINER function that joins invites to auth.users and
-- returns ONLY the two timestamps an admin needs. It is admin-gated inside the
-- body, and EXECUTE is revoked from anon — a non-admin calling it gets zero
-- rows rather than an error, which is the same shape RLS gives them elsewhere.
--
-- Deliberately narrow: no user ids, no tokens, no provider metadata. Widening
-- the SELECT here would widen what any signed-in admin can pull out of the auth
-- schema, so keep it to what the screen actually renders.

create or replace function public.invite_activity()
returns table (
  email            text,
  last_sign_in_at  timestamptz,
  first_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.email,
    u.last_sign_in_at,
    u.created_at as first_sign_in_at
  from public.invites i
  left join auth.users u on lower(u.email) = lower(i.email)
  where public.is_admin();
$$;

revoke execute on function public.invite_activity() from public, anon;
grant  execute on function public.invite_activity() to authenticated;

-- Verify (as a signed-in admin — returns nothing for anyone else):
--   select * from public.invite_activity() order by last_sign_in_at desc nulls last;
