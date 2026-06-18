-- Migration 017: password reset token flow + suspend/block status

-- Store the user-proposed 4-digit temp password alongside the reset request
alter table public.users add column if not exists password_reset_token text;

-- Drop old single-arg version (replaced with two-arg version below)
drop function if exists public.request_password_reset(text);

-- request_password_reset: user submits their access code + proposed 4-digit code
-- Silent no-op on unknown codes to prevent enumeration
create or replace function public.request_password_reset(in_user_code text, in_token text)
returns void language plpgsql security definer as $$
declare
  v_id uuid;
begin
  select id into v_id from public.users
   where user_code::text = in_user_code and status = 'active'
   limit 1;
  if v_id is null then return; end if;
  update public.users
     set password_reset_requested_at = now(),
         password_reset_token = in_token
   where id = v_id;
end;
$$;

grant execute on function public.request_password_reset(text, text) to anon;
grant execute on function public.request_password_reset(text, text) to authenticated;

-- approve_password_reset: admin/editor reads stored token and applies it as the password
create or replace function public.approve_password_reset(target_id uuid)
returns void language plpgsql security definer as $$
declare
  v_token text;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  select password_reset_token into v_token from public.users where id = target_id;
  if v_token is null then
    raise exception 'No reset token found';
  end if;
  update auth.users
     set encrypted_password = crypt(v_token, gen_salt('bf')),
         updated_at = now()
   where id = target_id;
  update public.users
     set password_reset_requested_at = null,
         password_reset_token = null
   where id = target_id;
end;
$$;
