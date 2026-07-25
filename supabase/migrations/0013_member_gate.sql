-- Martis Camp Families — close two holes in the access model.
--
-- 1) READ GATE. Until now, `authenticated` was treated as "is a member". It
--    isn't: magic-link sign-in creates an auth user for ANY email, and the
--    `invites` allowlist is only consulted by the client (see supabase/README.md
--    "Enforce the invite gate server-side"). So anyone who typed an email into
--    the site got a session and could read the whole directory — addresses,
--    phones, emails, and the attendance calendar (i.e. which houses are empty).
--    The "profile not set up yet" screen in App.jsx is cosmetic; the data was
--    already fetched, and the anon key ships in the bundle regardless.
--
--    Every shared read now requires a LINKED MEMBER ROW, not just a session.
--    An uninvited signer-in has no members row, so current_member_id() is null
--    and they see nothing. This is the durable half of the fix and it holds even
--    if the auth layer is misconfigured; pair it with a Before-User-Created auth
--    hook so uninvited people never get a session in the first place.
--
-- 2) PRIVILEGE FREEZE. members_update (0002) allows updating any row in your own
--    family with no column restriction, and is_admin is a plain column on that
--    table -- so any member could run
--        supabase.from('members').update({ is_admin: true }).eq('id', <self>)
--    and gain write access to every family, the community calendar, and the
--    invite allowlist. Same for user_id (re-point a relative's row at your own
--    auth user) and for INSERT (add an admin row pre-linked to yourself).
--    A trigger now freezes those columns for non-admin callers.
--
-- Also folds in scripts/photos_members_only.sql, so a rebuild from migrations/
-- alone doesn't resurrect world-readable personal photos.

-- === Helper ================================================================
-- "Is the caller a real member?" SECURITY DEFINER for the same reason as the
-- other helpers in 0002: it reads members, and would otherwise trip the very
-- policies that call it. Reveals only the caller's own state.
-- Note is_admin() implies is_member(), so `is_member()` alone is a sufficient
-- gate -- no need for `or is_admin()` anywhere below.
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;

revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- === 1) Gate every shared read on membership ===============================
-- Only the broad "visible to the community" policies change. Policies already
-- scoped to current_member_id() / current_family_id() / is_admin() (favorites,
-- feed_reads, event_invites, invites, admin_actions, add_requests_read) are
-- unchanged: those all evaluate to false/null for a non-member already.

drop policy if exists families_read on public.families;
create policy families_read on public.families for select to authenticated
  using (public.is_member() and (archived_at is null or public.is_admin()));

drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated
  using (public.is_member() and (archived_at is null or public.is_admin()));

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance for select to authenticated
  using (public.is_member());

drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated
  using (public.is_member() and public.can_see_event(events));

drop policy if exists rsvps_read on public.rsvps;
create policy rsvps_read on public.rsvps for select to authenticated
  using (public.is_member());

drop policy if exists community_read on public.community_calendar;
create policy community_read on public.community_calendar for select to authenticated
  using (public.is_member());

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated
  using (public.is_member() and (hidden_at is null or public.is_admin()));

drop policy if exists feed_read on public.feed;
create policy feed_read on public.feed for select to authenticated
  using (public.is_member());

-- add_requests_insert was `with check (true)` -- a non-member could file
-- requests into the admin queue.
drop policy if exists add_requests_insert on public.add_requests;
create policy add_requests_insert on public.add_requests for insert to authenticated
  with check (public.is_member());

-- === 1b) Photo storage: members-only, private buckets ======================
-- Supersedes scripts/photos_members_only.sql (which was never a numbered
-- migration). Buckets stay private; the app resolves short-lived signed URLs.
update storage.buckets set public = false
  where id in ('family-covers', 'member-photos', 'event-photos');

drop policy if exists mcf_photos_read on storage.objects;
create policy mcf_photos_read on storage.objects for select to authenticated
  using (public.is_member() and bucket_id in ('family-covers', 'member-photos', 'event-photos'));

-- Writes were open to any authenticated caller too -- an uninvited signer-in
-- could upload into the buckets.
drop policy if exists mcf_photos_insert on storage.objects;
create policy mcf_photos_insert on storage.objects for insert to authenticated
  with check (public.is_member() and bucket_id in ('family-covers', 'member-photos', 'event-photos'));

drop policy if exists mcf_photos_update on storage.objects;
create policy mcf_photos_update on storage.objects for update to authenticated
  using (public.is_member() and bucket_id in ('family-covers', 'member-photos', 'event-photos'))
  with check (public.is_member() and bucket_id in ('family-covers', 'member-photos', 'event-photos'));

drop policy if exists mcf_photos_delete on storage.objects;
create policy mcf_photos_delete on storage.objects for delete to authenticated
  using (public.is_member() and bucket_id in ('family-covers', 'member-photos', 'event-photos'));

-- === 2) Freeze privileged columns on members ===============================
-- Deliberately SECURITY INVOKER (the default): the guard keys off current_user,
-- which a SECURITY DEFINER function would pin to this function's owner and
-- break. As invoker, current_user is 'authenticated' for a PostgREST call from
-- the browser, but the function owner inside link_member_to_user() /
-- handle_new_user() (0006) -- so first-sign-in linking still works, and the
-- service-role key used by the WhatsApp agent is unaffected.
create or replace function public.guard_member_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Trusted callers: SECURITY DEFINER helpers, service_role, migrations.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A family may add its own members (0002 members_insert), but never a
    -- pre-promoted or pre-linked one.
    new.is_admin   := false;
    new.is_account := false;
    new.user_id    := null;
    return new;
  end if;

  -- UPDATE: silently preserve the privileged columns rather than raising, so
  -- ordinary profile edits (name/role/phone/email/interests/photo) still save.
  new.is_admin   := old.is_admin;
  new.is_account := old.is_account;
  new.user_id    := old.user_id;
  new.family_id  := old.family_id;
  return new;
end $$;

drop trigger if exists guard_member_privileges on public.members;
create trigger guard_member_privileges
  before insert or update on public.members
  for each row execute function public.guard_member_privileges();

-- === Verify ================================================================
-- As a signed-in MEMBER: both return true, and the directory reads normally.
--   select public.is_member(), public.current_member_id() is not null;
--
-- As a signed-in NON-member (sign in with an address that has no members row):
-- every one of these must come back empty.
--   select count(*) from public.families;    -- expect 0
--   select count(*) from public.members;     -- expect 0
--   select count(*) from public.attendance;  -- expect 0
--
-- Self-promotion must now be a silent no-op (0 rows changed, is_admin false):
--   update public.members set is_admin = true
--     where id = public.current_member_id() returning id, is_admin;
--
-- Buckets must all report private:
--   select id, public from storage.buckets
--     where id in ('family-covers','member-photos','event-photos');
