-- Add status column to users table
alter table public.users
  add column if not exists status text not null default 'active'
  check (status in ('pending', 'active'));

-- Existing users stay active
update public.users set status = 'active';

-- Admin can update any user's role and status
create policy "admin_update_users" on public.users
  for update
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- Admin can delete any user (for reject)
create policy "admin_delete_users" on public.users
  for delete
  using (get_my_role() = 'admin');

-- Rewrite handle_new_user trigger:
-- First user → active + admin
-- Everyone else → pending + viewer (admin must approve)
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_code text;
begin
  v_code := split_part(new.email, '@', 1);

  if not exists (select 1 from public.users) then
    insert into public.users (id, email, user_code, role, status)
    values (new.id, new.email, v_code, 'admin', 'active');
  else
    insert into public.users (id, email, user_code, role, status)
    values (new.id, new.email, v_code, 'viewer', 'pending');
  end if;

  perform setval('user_code_seq', greatest(
    (select last_value from user_code_seq), v_code::bigint));

  -- Auto-confirm email (fake domain, can't be delivered)
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now())
  where id = new.id;

  return new;
end;
$$;

-- Drop invite system
drop table if exists public.invitations cascade;
drop function if exists public.validate_invitation(text, text);
drop function if exists public.has_any_users();
