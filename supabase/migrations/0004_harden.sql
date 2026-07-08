-- Martis Camp Families — security hardening (clears advisor warnings)
-- 1) Pin search_path on the trigger function.
-- 2) The RLS helper functions are SECURITY DEFINER (needed to read members
--    without policy recursion). They only ever reveal the *caller's own* state,
--    but there's no reason for the anon role to call them via /rpc — restrict
--    EXECUTE to authenticated (which RLS requires).

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.current_member_id() from public, anon;
revoke execute on function public.current_family_id() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.can_see_event(public.events) from public, anon;

grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_family_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_see_event(public.events) to authenticated;
