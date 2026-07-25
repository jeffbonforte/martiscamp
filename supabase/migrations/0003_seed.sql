-- Martis Camp Families — seed data (mirrors src/data/mockData.js)
-- Anchored to the week of July 2025 (matches the app's calendar demo).
-- Idempotent-ish: safe to run once on a fresh project.

-- Families ----------------------------------------------------------------
insert into public.families (slug, name, address, hometown, cover_photo_url, tone) values
  ('bonforte','Bonforte','18 Creek Estates Dr','San Francisco, CA','family/bonfortes.jpg','var(--lake-600)'),
  ('bell','Bell','12 Lookout Loop','Palo Alto, CA','lodge.jpg','var(--pine-600)'),
  ('kwan','Kwan','48 Mystic Ridge','Seattle, WA','ski-lodge.jpg','var(--cedar-600)'),
  ('ford','Ford','7 Camp Cir','Sacramento, CA','family-barn.jpg','var(--act-dining)'),
  ('alvarez','Alvarez','22 Sabin Way','Reno, NV','treehouse-park.jpg','var(--lake-600)'),
  ('okafor','Okafor','31 Retreat Rd','Los Angeles, CA','camp-lodge-winter-aerial.jpg','var(--act-pool)'),
  ('reyes','Reyes','5 Aspen Grove','Denver, CO','golf-summer.jpg','var(--act-golf)')
on conflict (slug) do nothing;

-- Members -----------------------------------------------------------------
insert into public.members (family_id, name, role, photo_url, tone, phone, email, interests, is_account, is_admin)
select f.id, m.name, m.role, m.photo_url, m.tone, m.phone, m.email, m.interests, m.is_account, m.is_admin
from (values
  ('bonforte','Jeff Bonforte','Parent','/assets/images/family/jeff.jpg','var(--lake-600)','(530) 555-0100','jeff@bonforte.com', array['golf','ski'], true, true),
  ('bonforte','Amy Bonforte','Parent','/assets/images/family/amy.jpg','var(--cedar-600)','(530) 555-0101','amy@bonforte.com', array['tennis','hike','cafe'], false, false),
  ('bonforte','Tazio Bonforte','Kid · 17','/assets/images/family/tazio.jpg','var(--pine-600)',null,null, array['ski','social','golf'], false, false),
  ('bonforte','Tessa Bonforte','Kid · 14','/assets/images/family/tessa.jpg','var(--act-social)',null,null, array['pool','tennis','beach'], false, false),
  ('bonforte','Geo Bonforte','Kid · 11','/assets/images/family/geo.jpg','var(--act-golf)',null,null, array['puttputt','pool'], false, false),
  ('bell','Sara Bell','Parent',null,'var(--pine-600)','(530) 555-0111','sara@bell.family', array['tennis','hike'], false, false),
  ('bell','Tom Bell','Parent',null,'var(--cedar-600)','(530) 555-0112','tom@bell.family', array['golf'], false, false),
  ('bell','Ada Bell','Kid · 14',null,'var(--lake-600)',null,null, array['ski','pool'], false, false),
  ('bell','Cole Bell','Kid · 11',null,'var(--act-hike)',null,null, array['puttputt','pool'], false, false),
  ('kwan','Ben Kwan','Parent',null,'var(--cedar-600)','(530) 555-0131','ben@kwan.family', array['golf','beach'], false, false),
  ('kwan','Lily Kwan','Parent',null,'var(--lake-600)','(530) 555-0132','lily@kwan.family', array['pool','hike'], false, false),
  ('kwan','Owen Kwan','Kid · 9',null,'var(--act-golf)',null,null, array['puttputt'], false, false),
  ('ford','Mia Ford','Parent',null,'var(--act-dining)','(530) 555-0141','mia@ford.family', array['tennis','dining'], false, false),
  ('ford','Jake Ford','Parent',null,'var(--stone-600)','(530) 555-0142','jake@ford.family', array['golf'], false, false),
  ('alvarez','Rosa Alvarez','Parent',null,'var(--lake-600)','(530) 555-0151','rosa@alvarez.family', array['cafe','hike'], false, false),
  ('alvarez','Deb Alvarez','Parent',null,'var(--pine-600)','(530) 555-0152','deb@alvarez.family', array['ski'], false, false),
  ('alvarez','Nico Alvarez','Kid · 12',null,'var(--cedar-600)',null,null, array['ski','puttputt'], false, false),
  ('alvarez','Elle Alvarez','Kid · 8',null,'var(--act-social)',null,null, array['pool'], false, false),
  ('okafor','Chi Okafor','Parent',null,'var(--act-pool)','(530) 555-0161','chi@okafor.family', array['hike','beach'], false, false),
  ('okafor','Ada Okafor','Kid · 10',null,'var(--act-social)',null,null, array['pool'], false, false),
  ('reyes','Pat Reyes','Parent',null,'var(--act-golf)','(530) 555-0171','pat@reyes.family', array['golf','dining'], false, false),
  ('reyes','Sam Reyes','Parent',null,'var(--cedar-600)','(530) 555-0172','sam@reyes.family', array['tennis'], false, false),
  ('reyes','Jo Reyes','Kid · 13',null,'var(--lake-600)',null,null, array['tennis','pool'], false, false)
) as m(fslug, name, role, photo_url, tone, phone, email, interests, is_account, is_admin)
join public.families f on f.slug = m.fslug
where not exists (select 1 from public.members x where x.name = m.name);

-- Attendance (who's up, July 2025) ----------------------------------------
with dd(key, d) as (values
  ('thu', date '2025-07-10'),('fri', date '2025-07-11'),('sat', date '2025-07-12'),
  ('sun', date '2025-07-13'),('mon', date '2025-07-14'),('tue', date '2025-07-15'),('wed', date '2025-07-16')),
md(mname, key) as (values
  ('Jeff Bonforte','thu'),('Jeff Bonforte','fri'),('Jeff Bonforte','sat'),('Jeff Bonforte','sun'),
  ('Amy Bonforte','fri'),('Amy Bonforte','sat'),('Amy Bonforte','sun'),
  ('Tazio Bonforte','thu'),('Tazio Bonforte','fri'),('Tazio Bonforte','sat'),('Tazio Bonforte','sun'),
  ('Tessa Bonforte','fri'),('Tessa Bonforte','sat'),('Tessa Bonforte','sun'),
  ('Geo Bonforte','fri'),('Geo Bonforte','sat'),
  ('Sara Bell','fri'),('Sara Bell','sat'),('Sara Bell','sun'),
  ('Tom Bell','sat'),('Tom Bell','sun'),
  ('Ada Bell','fri'),('Ada Bell','sat'),('Ada Bell','sun'),
  ('Cole Bell','fri'),('Cole Bell','sat'),
  ('Ben Kwan','fri'),('Ben Kwan','sat'),
  ('Lily Kwan','fri'),('Lily Kwan','sat'),
  ('Owen Kwan','fri'),('Owen Kwan','sat'),
  ('Rosa Alvarez','sat'),('Rosa Alvarez','sun'),
  ('Deb Alvarez','sat'),('Deb Alvarez','sun'),
  ('Nico Alvarez','sat'),('Nico Alvarez','sun'),
  ('Elle Alvarez','sat'),
  ('Pat Reyes','thu'),('Pat Reyes','fri'),('Pat Reyes','sat'),('Pat Reyes','sun'),('Pat Reyes','mon'),('Pat Reyes','tue'),('Pat Reyes','wed'),
  ('Sam Reyes','fri'),('Sam Reyes','sat'),('Sam Reyes','sun'),
  ('Jo Reyes','thu'),('Jo Reyes','fri'),('Jo Reyes','sat'),('Jo Reyes','sun'),('Jo Reyes','mon'),('Jo Reyes','tue'),('Jo Reyes','wed'))
insert into public.attendance (member_id, family_id, date, created_by)
select m.id, m.family_id, dd.d, m.id
from md join public.members m on m.name = md.mname join dd on dd.key = md.key
on conflict (member_id, date) do nothing;

-- Get-togethers (events) --------------------------------------------------
insert into public.events (slug, title, amenity, host_member_id, when_label, location, description, visibility, capacity)
select e.slug, e.title, e.amenity, h.id, e.when_label, e.location, e.description, e.visibility, e.capacity
from (values
  ('golf-sat','Saturday morning 9 holes','golf','Tom Bell','Sat, Jul 12 · 8:30 AM','Golf clubhouse',
    'A private foursome before it heats up — grabbing one cart and finishing with lunch at the Bistro. Invited a few of the usual crew.','private', 4),
  ('dinner-fri','Family dinner at the Bistro','dining','Rosa Alvarez','Fri, Jul 11 · 6:30 PM','Camp Lodge Bistro',
    'Big table on the patio to kick off the weekend. Bring the whole crew — highchairs sorted for the little ones.','open', 16),
  ('paddle-sat','Sunset paddle at the Lake Club','beach','Ben Kwan','Sat, Jul 12 · 5:00 PM','The Lake Club',
    'Paddleboards and kayaks out on the lake for golden hour. Life vests provided; strong swimmers only for the boards.','open', 10),
  ('hike-sun','Morning hike — Lookout loop','hike','Chi Okafor','Sun, Jul 13 · 7:30 AM','Trailhead by Lookout Lodge',
    'Easy 3-mile loop with a stop at the overlook. Coffee at Martis Perk after for anyone who wants it.','open', 12),
  ('happyhour-fri','Open house happy hour','social','Sara Bell','Fri, Jul 11 · 5:30 PM','The Bells — 12 Lookout Loop',
    'Doors open, drinks out on the deck — swing by whenever. No headcount, bring the kids and whoever''s up.','open', null)
) as e(slug, title, amenity, host_name, when_label, location, description, visibility, capacity)
join public.members h on h.name = e.host_name
on conflict (slug) do nothing;

-- Event invites (private golf) --------------------------------------------
insert into public.event_invites (event_id, member_id, invited_by)
select ev.id, m.id, ev.host_member_id
from public.events ev
join public.members m on m.name in ('Tom Bell','Ben Kwan','Pat Reyes','Jeff Bonforte')
where ev.slug = 'golf-sat'
on conflict (event_id, member_id) do nothing;

-- RSVPs -------------------------------------------------------------------
insert into public.rsvps (event_id, member_id, status)
select ev.id, m.id, r.status
from (values
  ('golf-sat','Tom Bell','going'),('golf-sat','Ben Kwan','going'),('golf-sat','Pat Reyes','maybe'),
  ('dinner-fri','Jeff Bonforte','going'),('dinner-fri','Rosa Alvarez','going'),('dinner-fri','Sara Bell','going'),
  ('dinner-fri','Pat Reyes','going'),('dinner-fri','Mia Ford','going'),('dinner-fri','Lily Kwan','going'),('dinner-fri','Sam Reyes','maybe'),
  ('paddle-sat','Ben Kwan','going'),('paddle-sat','Lily Kwan','going'),('paddle-sat','Ada Bell','maybe'),('paddle-sat','Sara Bell','maybe'),
  ('hike-sun','Rosa Alvarez','going'),('hike-sun','Sara Bell','maybe'),('hike-sun','Pat Reyes','declined'),
  ('happyhour-fri','Sara Bell','going'),('happyhour-fri','Tom Bell','going'),('happyhour-fri','Rosa Alvarez','going'),
  ('happyhour-fri','Mia Ford','going'),('happyhour-fri','Ben Kwan','going'),('happyhour-fri','Pat Reyes','going'),('happyhour-fri','Lily Kwan','maybe')
) as r(eslug, mname, status)
join public.events ev on ev.slug = r.eslug
join public.members m on m.name = r.mname
on conflict (event_id, member_id) do nothing;

-- Community calendar ------------------------------------------------------
insert into public.community_calendar (title, place, amenity, day_of_month, day_key, is_community) values
  ('Live music at the Barn','The Family Barn','social',11,'fri',true),
  ('Junior tennis clinic','Tennis Pavilion','tennis',12,'sat',true),
  ('Pancake breakfast','Martis Perk','cafe',13,'sun',true)
on conflict do nothing;

-- Activity feed -----------------------------------------------------------
insert into public.feed (kind, actor_label, tone, body, event_slug, family_slug) values
  ('announcement','Martis Camp','var(--cedar-600)','Lake Club closed Saturday 8–11am for dock maintenance — pool open as usual.',null,null),
  ('invite','Tom Bell','var(--pine-600)','invited you to a private foursome — Saturday morning 9 holes.','golf-sat',null),
  ('arrival','The Alvarez family','var(--lake-600)','is arriving Saturday for the weekend.',null,'alvarez'),
  ('gathering','Sara Bell','var(--pine-600)','is hosting an open house happy hour Friday at 5:30.','happyhour-fri',null),
  ('community','Martis Camp','var(--cedar-600)','Live music at the Family Barn, Friday evening.',null,null),
  ('rsvp','Ben Kwan','var(--cedar-600)','is in for the Saturday paddle at the Lake Club.','paddle-sat',null),
  ('comment','Rosa Alvarez','var(--lake-600)','commented on the Bistro dinner: "We''ll grab the big patio table."','dinner-fri',null)
on conflict do nothing;

-- Invite gate for the demo owner ------------------------------------------
insert into public.invites (email, family_id, accepted_at)
select 'jeff@bonforte.com', f.id, now() from public.families f where f.slug = 'bonforte'
on conflict (email) do nothing;
