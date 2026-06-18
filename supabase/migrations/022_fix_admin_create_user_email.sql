-- Migration 022: fix admin_create_user to set auth.users.email via UPDATE
-- INSERT cannot set email (Supabase restriction), but UPDATE works fine.
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

  -- Set email via UPDATE (INSERT restriction doesn't apply to UPDATE)
  update auth.users
     set email = lower(trim(in_email))
   where id = v_id;

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
