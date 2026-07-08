-- Martis Camp Families — link auth users to their member row.
-- The client can't self-link via a normal UPDATE (RLS requires you to already be
-- linked), so use a SECURITY DEFINER function the client calls after sign-in,
-- plus a trigger that auto-links on new sign-ups.

create or replace function public.link_member_to_user()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  update public.members
    set user_id = auth.uid(), is_account = true
    where user_id is null
      and lower(email) = lower((select email from auth.users where id = auth.uid()));
end $$;

revoke execute on function public.link_member_to_user() from public, anon;
grant execute on function public.link_member_to_user() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.members set user_id = new.id, is_account = true
    where user_id is null and lower(email) = lower(new.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
