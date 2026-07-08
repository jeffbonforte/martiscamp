-- Martis Camp Families — role grants
-- Tables created via the MCP migration didn't pick up Supabase's default DML
-- grants, so authenticated/service_role were missing SELECT/INSERT/UPDATE/DELETE
-- (RLS can't do anything without the base table privilege). Grant them here;
-- RLS policies still govern which rows each user may touch. `anon` is granted
-- nothing on purpose — this app requires auth for all data.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Future tables/sequences inherit the same grants.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
