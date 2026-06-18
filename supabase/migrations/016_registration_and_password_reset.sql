-- Migration 016: Registration auto-assign, auth.identities fix, password reset flow

-- Add password reset request column
alter table public.users add column if not exists password_reset_requested_at timestamptz;

-- register_user: called by anon, auto-assigns user_code, creates auth user + identity, starts as pending
create or replace function public.register_user(in_password text)
returns json language plpgsql security definer as $$
declare
  v_code bigint;
  v_email text;
  v_id uuid;
begin
  v_code := nextval('user_code_seq');
  v_email := v_code::text || '@it.local';
  v_id    := gen_random_uuid();

  insert into auth.users (
    id, email, encrypted_password, email_confirmed_at,
    aud, role, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    v_id, v_email,
    crypt(in_password, gen_salt('bf')),
    now(), 'authenticated', 'authenticated', now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    email, created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', v_email, v_email, now(), now(), now()
  );

  -- trigger creates public.users row as pending/viewer; that's fine
  return json_build_object('user_code', v_code);
end;
$$;

grant execute on function public.register_user(text) to anon;

-- admin_create_user: editor+ can create a user directly (active, skips approval)
create or replace function public.admin_create_user(
  in_password text,
  in_role text default 'viewer',
  in_display_name text default null
)
returns json language plpgsql security definer as $$
declare
  v_code bigint;
  v_email text;
  v_id uuid;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;

  v_code := nextval('user_code_seq');
  v_email := v_code::text || '@it.local';
  v_id    := gen_random_uuid();

  insert into auth.users (
    id, email, encrypted_password, email_confirmed_at,
    aud, role, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    v_id, v_email,
    crypt(in_password, gen_salt('bf')),
    now(), 'authenticated', 'authenticated', now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    email, created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', v_email, v_email, now(), now(), now()
  );

  -- override trigger defaults: set active + role + display_name
  update public.users
     set status = 'active', role = in_role, display_name = in_display_name
   where id = v_id;

  return json_build_object('user_code', v_code, 'id', v_id);
end;
$$;

-- admin_reset_password: editor+ can reset any user's password and clear the request flag
create or replace function public.admin_reset_password(
  target_id uuid,
  new_password text
)
returns void language plpgsql security definer as $$
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;

  update auth.users
     set encrypted_password = crypt(new_password, gen_salt('bf')),
         updated_at = now()
   where id = target_id;

  update public.users
     set password_reset_requested_at = null
   where id = target_id;
end;
$$;

-- request_password_reset: anon/authenticated user can request a reset by user_code
-- silently no-ops on unknown codes to prevent user enumeration
create or replace function public.request_password_reset(in_user_code text)
returns void language plpgsql security definer as $$
declare
  v_id uuid;
begin
  select id into v_id from public.users
   where user_code::text = in_user_code and status = 'active'
   limit 1;

  if v_id is null then
    return; -- silent no-op
  end if;

  update public.users
     set password_reset_requested_at = now()
   where id = v_id;
end;
$$;

grant execute on function public.request_password_reset(text) to anon;
grant execute on function public.request_password_reset(text) to authenticated;
