-- Martis Camp Families — "request to add" queue.
-- Any signed-in member can request that the admin add a person or a whole
-- family (with an email); the admin triages these in the Admin → Requests tab
-- and creates the family/invite with the existing tools.

create table if not exists public.add_requests (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'person' check (kind in ('person','family')),
  name         text not null,
  email        text,
  note         text,
  requested_by uuid references public.members(id) on delete set null,
  status       text not null default 'open' check (status in ('open','done','dismissed')),
  created_at   timestamptz not null default now()
);

alter table public.add_requests enable row level security;

-- Any signed-in member may submit a request.
drop policy if exists add_requests_insert on public.add_requests;
create policy add_requests_insert on public.add_requests for insert to authenticated
  with check (true);

-- Admins triage all; a member can see the ones they submitted.
drop policy if exists add_requests_read on public.add_requests;
create policy add_requests_read on public.add_requests for select to authenticated
  using (public.is_admin() or requested_by = public.current_member_id());

drop policy if exists add_requests_update on public.add_requests;
create policy add_requests_update on public.add_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
