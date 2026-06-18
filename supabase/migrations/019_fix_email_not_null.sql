-- Migration 019: drop NOT NULL constraint on public.users.email
-- The handle_new_user trigger inserts without email (set later by register_user/admin_create_user)
alter table public.users alter column email drop not null;

-- Update handle_new_user to capture email from new.email when available (defensive)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_code bigint;
begin
  v_code := nextval('user_code_seq');
  insert into public.users (id, user_code, role, status, display_name, email)
  values (
    new.id,
    v_code,
    'viewer',
    'pending',
    new.raw_user_meta_data->>'display_name',
    nullif(trim(new.email), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
