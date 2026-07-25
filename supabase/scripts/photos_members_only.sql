-- SUPERSEDED by migrations/0013_member_gate.sql, which does all of this and
-- additionally requires a linked member row (not just any session) to read.
-- Kept for reference only -- do not run it after 0013, or it will widen the
-- read policy back to every authenticated user. Nothing here needs applying to
-- a database that has 0013.
--
-- Make personal photo storage members-only. Run in the Supabase SQL Editor
-- AFTER the signed-URL app code is deployed (the app resolves signed URLs, so
-- flipping these private no longer breaks display). Generic scenery heroes/logo
-- live in the app's public /assets and are unaffected.

-- 1) Private buckets (no public CDN access).
update storage.buckets set public = false
  where id in ('family-covers','member-photos','event-photos');

-- 2) Read only for signed-in members (was: anyone). Insert/update/delete already
--    require authentication.
drop policy if exists mcf_photos_read on storage.objects;
create policy mcf_photos_read on storage.objects for select to authenticated
  using (bucket_id in ('family-covers','member-photos','event-photos'));

-- Check: expect public = false for all three.
--   select id, public from storage.buckets where id in ('family-covers','member-photos','event-photos');
