-- One-off ops script (run in the Supabase SQL Editor): re-create Jeff's real
-- household on the Bonforte family and wire in the bundled member portraits
-- (served from /assets/images/family/*.jpg on the app). Run AFTER those photos
-- are deployed. Attendance is left empty — real days get marked in-app.

begin;

-- Jeff's member row already exists (from the wipe) — add his photo + details.
update public.members
set photo_url = '/assets/images/family/jeff.jpg',
    role = 'Parent',
    tone = 'var(--lake-600)',
    phone = '(530) 555-0100',
    interests = array['golf','ski']
where lower(email) = lower('jeff@bonforte.com');

-- Add the rest of the family to the Bonforte family.
insert into public.members (family_id, name, role, photo_url, tone, phone, email, interests, is_account, is_admin)
select f.id, m.name, m.role, m.photo_url, m.tone, m.phone, m.email, m.interests, false, false
from public.families f
join (values
  ('Amy Bonforte',   'Parent',   '/assets/images/family/amy.jpg',   'var(--cedar-600)',  '(530) 555-0101', 'amy@bonforte.com', array['tennis','hike','cafe']),
  ('Tazio Bonforte', 'Kid · 17', '/assets/images/family/tazio.jpg', 'var(--pine-600)',   null,             null,               array['ski','social','golf']),
  ('Tessa Bonforte', 'Kid · 14', '/assets/images/family/tessa.jpg', 'var(--act-social)', null,             null,               array['pool','tennis','beach']),
  ('Geo Bonforte',   'Kid · 11', '/assets/images/family/geo.jpg',   'var(--act-golf)',   null,             null,               array['puttputt','pool'])
) as m(name, role, photo_url, tone, phone, email, interests) on true
where f.slug = 'bonforte';

commit;

-- Check: expect 5 members, each with a photo_url.
--   select name, role, email, photo_url from public.members order by name;
