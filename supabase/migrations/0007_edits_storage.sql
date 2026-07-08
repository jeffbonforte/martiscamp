-- Martis Camp Families — profile edits, family self-edit, and photo storage.

-- 1) Families get an editable interests array (previously derived from members).
alter table public.families add column if not exists interests text[] not null default '{}';

-- 2) Let a family edit its OWN family row (not just admins). Insert/delete stay admin-only.
drop policy if exists families_write on public.families;
create policy families_update on public.families for update to authenticated
  using (public.is_admin() or id = public.current_family_id())
  with check (public.is_admin() or id = public.current_family_id());
create policy families_insert on public.families for insert to authenticated
  with check (public.is_admin());
create policy families_delete on public.families for delete to authenticated
  using (public.is_admin());

-- 3) Storage buckets for photos (public read via CDN; authenticated write).
insert into storage.buckets (id, name, public) values
  ('family-covers', 'family-covers', true),
  ('member-photos', 'member-photos', true),
  ('event-photos',  'event-photos',  true)
on conflict (id) do nothing;

-- Storage RLS: anyone can read (public buckets), authenticated members can
-- upload/update/delete within these three buckets.
drop policy if exists mcf_photos_read on storage.objects;
create policy mcf_photos_read on storage.objects for select
  using (bucket_id in ('family-covers','member-photos','event-photos'));

drop policy if exists mcf_photos_insert on storage.objects;
create policy mcf_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('family-covers','member-photos','event-photos'));

drop policy if exists mcf_photos_update on storage.objects;
create policy mcf_photos_update on storage.objects for update to authenticated
  using (bucket_id in ('family-covers','member-photos','event-photos'))
  with check (bucket_id in ('family-covers','member-photos','event-photos'));

drop policy if exists mcf_photos_delete on storage.objects;
create policy mcf_photos_delete on storage.objects for delete to authenticated
  using (bucket_id in ('family-covers','member-photos','event-photos'));
