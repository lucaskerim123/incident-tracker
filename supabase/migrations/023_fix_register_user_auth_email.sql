-- Migration 023: fix register_user to set auth.users.email via UPDATE
-- Root cause: register_user inserted into auth.users without email (Supabase INSERT restriction),
-- but unlike admin_create_user (fixed in 022), never followed up with UPDATE to set the email.
-- Supabase signInWithPassword looks up users by auth.users.email, so users registered via
-- register_user could not log in despite having a valid password hash.

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
     set email = lower(trim(in_email)),
         display_name = coalesce(in_display_name, display_name)
   where id = v_id;

  select user_code into v_code from public.users where id = v_id;
  return json_build_object('id', v_id, 'user_code', v_code);
end;
$$;

grant execute on function public.register_user(text, text, text) to anon;

-- Backfill existing users where auth.users.email is NULL
-- Uses identity_data->>'email' which was always populated correctly
update auth.users au
   set email = ai.identity_data->>'email'
  from auth.identities ai
 where au.id = ai.user_id
   and ai.provider = 'email'
   and au.email is null;
