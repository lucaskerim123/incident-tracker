-- Migration 026: fix bcrypt cost factor + add admin email edit RPC
-- PostgreSQL pgcrypto gen_salt('bf') defaults to cost 6; GoTrue requires >= 10.
-- All password-hashing functions updated to use gen_salt('bf', 10).

-- ── Fix admin_create_user ────────────────────────────────────────────────────
create or replace function public.admin_create_user(
  in_email text,
  in_password text,
  in_role text default 'viewer',
  in_display_name text default null
)
returns json language plpgsql security definer
set search_path = public as $$
declare
  v_id uuid;
  v_code bigint;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  v_id := gen_random_uuid();
  insert into auth.users (
    id, encrypted_password, email_confirmed_at,
    aud, role, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    v_id, crypt(in_password, gen_salt('bf', 10)),
    now(), 'authenticated', 'authenticated', now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', in_display_name)
  );
  update auth.users set email = lower(trim(in_email)) where id = v_id;
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(trim(in_email))),
    'email', lower(trim(in_email)),
    now(), now(), now()
  );
  update public.users
     set status = 'active', role = in_role,
         display_name = in_display_name,
         email = lower(trim(in_email))
   where id = v_id;
  select user_code into v_code from public.users where id = v_id;
  return json_build_object('user_code', v_code, 'id', v_id, 'email', lower(trim(in_email)));
end;
$$;

-- ── Fix admin_reset_password ─────────────────────────────────────────────────
create or replace function public.admin_reset_password(
  target_id uuid,
  new_password text
)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  update auth.users
     set encrypted_password = crypt(new_password, gen_salt('bf', 10)),
         updated_at = now()
   where id = target_id;
  update public.users
     set password_reset_requested_at = null
   where id = target_id;
end;
$$;

-- ── Fix approve_password_reset ───────────────────────────────────────────────
create or replace function public.approve_password_reset(target_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
declare v_token text;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  select password_reset_token into v_token from public.users where id = target_id;
  if v_token is null then
    raise exception 'No reset token found';
  end if;
  update auth.users
     set encrypted_password = crypt(v_token, gen_salt('bf', 10)),
         updated_at = now()
   where id = target_id;
  update public.users
     set password_reset_requested_at = null,
         password_reset_token = null
   where id = target_id;
end;
$$;

-- ── Fix register_user ────────────────────────────────────────────────────────
create or replace function public.register_user(
  in_email text,
  in_password text,
  in_display_name text default null
)
returns json language plpgsql security definer
set search_path = public as $$
declare
  v_id uuid;
  v_code bigint;
begin
  v_id := gen_random_uuid();
  insert into auth.users (
    id, encrypted_password, email_confirmed_at,
    aud, role, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    v_id, crypt(in_password, gen_salt('bf', 10)),
    now(), 'authenticated', 'authenticated', now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', in_display_name)
  );
  update auth.users set email = lower(trim(in_email)) where id = v_id;
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(trim(in_email))),
    'email', lower(trim(in_email)),
    now(), now(), now()
  );
  update public.users
     set email = lower(trim(in_email)),
         display_name = coalesce(in_display_name, display_name)
   where id = v_id;
  select user_code into v_code from public.users where id = v_id;
  return json_build_object('id', v_id, 'user_code', v_code);
end;
$$;

grant execute on function public.register_user(text, text, text) to anon;

-- ── Re-hash existing admin-created users at cost 10 ─────────────────────────
-- Any user whose hash starts with $2a$06$ was created via our RPC with cost 6.
-- Re-hashing requires knowing the plaintext — we can't do that automatically.
-- Admins must reset those users' passwords via admin_reset_password.

-- ── New: admin_update_user_email ─────────────────────────────────────────────
create or replace function public.admin_update_user_email(
  target_id uuid,
  new_email text
)
returns void language plpgsql security definer
set search_path = public as $$
declare v_email text;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  v_email := lower(trim(new_email));
  if v_email = '' then
    raise exception 'Email cannot be empty';
  end if;
  update auth.users set email = v_email where id = target_id;
  update auth.identities
     set provider_id = v_email,
         identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_email)),
         updated_at = now()
   where user_id = target_id and provider = 'email';
  update public.users set email = v_email where id = target_id;
end;
$$;
