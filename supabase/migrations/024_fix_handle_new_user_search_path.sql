-- Migration 024: fix handle_new_user search_path
-- The function had no search_path set (proconfig = null). When Supabase's auth
-- system fires the trigger, it runs with a restricted search_path that excludes
-- public, causing nextval('user_code_seq') to fail with "relation does not exist".
-- Fix: add SET search_path = public to the function definition.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

-- Reset sequence so first real user gets #1000
alter sequence user_code_seq restart with 1000;
