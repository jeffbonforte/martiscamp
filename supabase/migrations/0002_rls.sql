-- Martis Camp Families — Row Level Security
-- Model: it's a shared community directory, so authenticated members can READ
-- families/members/attendance/events(visible)/community/rsvps/feed. They can
-- WRITE only their own family's members, their own attendance/rsvps/comments/
-- favorites. Admins (members.is_admin) bypass ownership on managed tables.

-- Helper functions (SECURITY DEFINER so they can read members without tripping
-- the very policies that call them). -------------------------------------
create or replace function public.current_member_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.members where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_family_id()
returns uuid language sql stable security definer set search_path = public as $$
  select family_id from public.members where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.members where user_id = auth.uid() limit 1), false);
$$;

create or replace function public.can_see_event(ev public.events)
returns boolean language sql stable security definer set search_path = public as $$
  select ev.visibility = 'open'
      or public.is_admin()
      or ev.host_member_id = public.current_member_id()
      or exists (select 1 from public.event_invites i
                 where i.event_id = ev.id and i.member_id = public.current_member_id());
$$;

-- Enable RLS everywhere ---------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'families','members','attendance','events','event_invites','rsvps',
    'community_calendar','comments','favorites','feed','feed_reads',
    'invites','admin_actions'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- families ----------------------------------------------------------------
create policy families_read on public.families for select to authenticated using (archived_at is null or public.is_admin());
create policy families_write on public.families for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- members -----------------------------------------------------------------
create policy members_read on public.members for select to authenticated using (archived_at is null or public.is_admin());
create policy members_insert on public.members for insert to authenticated
  with check (public.is_admin() or family_id = public.current_family_id());
create policy members_update on public.members for update to authenticated
  using (public.is_admin() or family_id = public.current_family_id())
  with check (public.is_admin() or family_id = public.current_family_id());
create policy members_delete on public.members for delete to authenticated
  using (public.is_admin());

-- attendance --------------------------------------------------------------
create policy attendance_read on public.attendance for select to authenticated using (true);
create policy attendance_write on public.attendance for all to authenticated
  using (public.is_admin() or family_id = public.current_family_id())
  with check (public.is_admin() or family_id = public.current_family_id());

-- events ------------------------------------------------------------------
create policy events_read on public.events for select to authenticated using (public.can_see_event(events));
create policy events_insert on public.events for insert to authenticated
  with check (public.is_admin() or host_member_id = public.current_member_id());
create policy events_update on public.events for update to authenticated
  using (public.is_admin() or host_member_id = public.current_member_id())
  with check (public.is_admin() or host_member_id = public.current_member_id());
create policy events_delete on public.events for delete to authenticated
  using (public.is_admin() or host_member_id = public.current_member_id());

-- event_invites -----------------------------------------------------------
create policy invites_read on public.event_invites for select to authenticated
  using (public.is_admin()
      or member_id = public.current_member_id()
      or exists (select 1 from public.events e where e.id = event_id and e.host_member_id = public.current_member_id()));
create policy invites_write on public.event_invites for all to authenticated
  using (public.is_admin() or exists (select 1 from public.events e where e.id = event_id and e.host_member_id = public.current_member_id()))
  with check (public.is_admin() or exists (select 1 from public.events e where e.id = event_id and e.host_member_id = public.current_member_id()));

-- rsvps -------------------------------------------------------------------
create policy rsvps_read on public.rsvps for select to authenticated using (true);
create policy rsvps_write on public.rsvps for all to authenticated
  using (public.is_admin() or member_id = public.current_member_id())
  with check (public.is_admin() or member_id = public.current_member_id());

-- community_calendar ------------------------------------------------------
create policy community_read on public.community_calendar for select to authenticated using (true);
create policy community_write on public.community_calendar for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- comments ----------------------------------------------------------------
create policy comments_read on public.comments for select to authenticated using (hidden_at is null or public.is_admin());
create policy comments_insert on public.comments for insert to authenticated
  with check (member_id = public.current_member_id());
create policy comments_update on public.comments for update to authenticated
  using (public.is_admin() or member_id = public.current_member_id())
  with check (public.is_admin() or member_id = public.current_member_id());
create policy comments_delete on public.comments for delete to authenticated
  using (public.is_admin() or member_id = public.current_member_id());

-- favorites (private to the actor) ----------------------------------------
create policy favorites_read on public.favorites for select to authenticated using (member_id = public.current_member_id());
create policy favorites_write on public.favorites for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- feed --------------------------------------------------------------------
create policy feed_read on public.feed for select to authenticated using (true);
create policy feed_insert on public.feed for insert to authenticated
  with check (public.is_admin() or actor_member_id = public.current_member_id());

-- feed_reads (own) --------------------------------------------------------
create policy feed_reads_rw on public.feed_reads for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- invites (admin only) ----------------------------------------------------
create policy invites_admin on public.invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- admin_actions (admin only) ----------------------------------------------
create policy admin_actions_read on public.admin_actions for select to authenticated using (public.is_admin());
create policy admin_actions_insert on public.admin_actions for insert to authenticated with check (public.is_admin());
