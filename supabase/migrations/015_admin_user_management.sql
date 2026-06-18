-- Create user bypassing registration flow (admin/editor)
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

  -- trigger creates public.users row as pending/viewer; override it
  update public.users
     set status = 'active', role = in_role, display_name = in_display_name
   where id = v_id;

  return json_build_object('user_code', v_code, 'id', v_id);
end;
$$;

-- Reset any user's password (admin/editor only)
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
end;
$$;
