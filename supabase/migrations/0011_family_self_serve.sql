-- Martis Camp Families — let a family account-holder manage their OWN household.
-- Members can already be inserted by a family into its own family (see
-- members_insert in 0002). This adds the matching invite access so adding a
-- member with an email auto-approves them — scoped strictly to the caller's own
-- family, so nobody can approve people into someone else's family. Admins keep
-- full access via the existing invites_admin policy.

-- Read invites for your own family (admins already see all).
drop policy if exists invites_family_read on public.invites;
create policy invites_family_read on public.invites for select to authenticated
  using (public.is_admin() or family_id = public.current_family_id());

-- Add an invite only for your own family.
drop policy if exists invites_family_insert on public.invites;
create policy invites_family_insert on public.invites for insert to authenticated
  with check (public.is_admin() or family_id = public.current_family_id());

-- Update an invite only if it already belongs to your family, and it must stay
-- in your family (prevents re-assigning someone else's invite to yourself).
drop policy if exists invites_family_update on public.invites;
create policy invites_family_update on public.invites for update to authenticated
  using (public.is_admin() or family_id = public.current_family_id())
  with check (public.is_admin() or family_id = public.current_family_id());
