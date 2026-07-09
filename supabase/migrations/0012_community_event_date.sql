-- Martis Camp Families — community events on any calendar date.
-- The original schema only stored day_of_month + day_key (a weekday within the
-- rolling demo week), which limited community events to the next 7 days. Add a
-- real DATE so an admin can schedule an event on any future day.
alter table public.community_calendar add column if not exists event_date date;
