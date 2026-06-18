alter table public.users
  add column if not exists deletion_requested_at timestamptz;

-- SECURITY DEFINER so admin can delete from auth.users via RPC
-- (anon/service key can't directly delete auth.users rows from client)
create or replace function public.delete_user(target_id uuid)
returns void language plpgsql security definer as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Unauthorized';
  end if;
  delete from auth.users where id = target_id;
end;
$$;
