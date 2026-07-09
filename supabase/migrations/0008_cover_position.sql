-- Martis Camp Families — family billboard focal point.
--
-- Family covers are often portrait family photos. A center crop (the previous
-- fixed behavior) cut through people's heads on the wide billboard. Store a CSS
-- object-position string ("50% 38%") chosen by the host in the edit dialog, so
-- the same crop applies consistently across the profile billboard, directory
-- cards, and favorite tiles. Null → the screen's art-directed default.
alter table public.families add column if not exists cover_photo_pos text;
