-- Migration 018: switch to real email-based auth
-- Fixes "cannot insert non-DEFAULT value into column email" by omitting email
-- from auth.users INSERT; email is populated via auth.identities instead

alter table public.users add column if not exists email text;

-- Update handle_new_user: capture display_name from metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_code bigint;
begin
  v_code := nextval('user_code_seq');
  insert into public.users (id, user_code, role, status, display_name)
  values (new.id, v_code, 'viewer', 'pending', new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- register_user: email + password + optional display_name
-- Does NOT insert email into auth.users (newer Supabase schema restriction)
create or replace function public.register_user(
  in_email text,
  in_password text,
  in_display_name text default null
)
returns json language plpgsql security definer as $$
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
    v_id, crypt(in_password, gen_salt('bf')),
    now(), 'authenticated', 'authenticated', now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', in_display_name)
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    email, created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(trim(in_email))),
    'email', lower(trim(in_email)), lower(trim(in_email)), now(), now(), now()
  );

  update public.users
     set email = lower(trim(in_email)),
         display_name = coalesce(in_display_name, display_name)
   where id = v_id;

  select user_code into v_code from public.users where id = v_id;
  return json_build_object('id', v_id, 'user_code', v_code);
end;
$$;

drop function if exists public.register_user(text);
grant execute on function public.register_user(text, text, text) to anon;

-- admin_create_user: now requires in_email
create or replace function public.admin_create_user(
  in_email text,
  in_password text,
  in_role text default 'viewer',
  in_display_name text default null
)
returns json language plpgsql security definer as $$
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
    v_id, crypt(in_password, gen_salt('bf')),
    now(), 'authenticated', 'authenticated', now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', in_display_name)
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    email, created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(trim(in_email))),
    'email', lower(trim(in_email)), lower(trim(in_email)), now(), now(), now()
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

drop function if exists public.admin_create_user(text, text, text);

-- request_password_reset: look up by email (drop old user_code version, recreate)
drop function if exists public.request_password_reset(text, text);

create function public.request_password_reset(in_email text, in_token text)
returns void language plpgsql security definer as $$
declare v_id uuid;
begin
  select pu.id into v_id
    from public.users pu
    join auth.users au on au.id = pu.id
   where lower(au.email) = lower(trim(in_email)) and pu.status = 'active'
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
