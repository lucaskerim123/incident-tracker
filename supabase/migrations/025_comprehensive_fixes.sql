-- Migration 025: comprehensive fixes from full diagnostic
-- 1. SET search_path = public on all SECURITY DEFINER functions
-- 2. update_updated_at trigger for incidents
-- 3. editor role idempotent seed
-- 4. fix lawyer DB permissions to match frontend (view-only)
-- 5. expand delete_user to allow editors (needed for pending user rejection)

-- ── 1a. get_my_role ──────────────────────────────────────────────────────────
create or replace function public.get_my_role()
returns text language sql security definer stable
set search_path = public as $$
  select role from users where id = auth.uid() limit 1;
$$;

-- ── 1b. can_do ───────────────────────────────────────────────────────────────
create or replace function public.can_do(action text)
returns boolean language sql security definer stable
set search_path = public as $$
  select coalesce((
    select
      case action
        when 'view'           then ur.can_view
        when 'add'            then ur.can_add
        when 'edit'           then ur.can_edit
        when 'delete'         then ur.can_delete
        when 'upload'         then ur.can_upload
        when 'manage_people'  then ur.can_manage_people
        when 'manage_cases'   then ur.can_manage_cases
        when 'invite'         then ur.can_invite_users
        when 'export'         then ur.can_export
        else false
      end
    from users u
    join user_roles ur on ur.name = u.role
    where u.id = auth.uid()
    limit 1
  ), false);
$$;

-- ── 1c. delete_user (also expanded to allow editor for pending user rejection) ─
create or replace function public.delete_user(target_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

-- ── 1d. admin_reset_password ─────────────────────────────────────────────────
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
     set encrypted_password = crypt(new_password, gen_salt('bf')),
         updated_at = now()
   where id = target_id;
  update public.users
     set password_reset_requested_at = null
   where id = target_id;
end;
$$;

-- ── 1e. approve_password_reset ───────────────────────────────────────────────
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
     set encrypted_password = crypt(v_token, gen_salt('bf')),
         updated_at = now()
   where id = target_id;
  update public.users
     set password_reset_requested_at = null,
         password_reset_token = null
   where id = target_id;
end;
$$;

-- ── 1f. register_user ────────────────────────────────────────────────────────
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
    v_id, crypt(in_password, gen_salt('bf')),
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

-- ── 1g. admin_create_user ────────────────────────────────────────────────────
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
    v_id, crypt(in_password, gen_salt('bf')),
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

-- ── 2. update_updated_at trigger for incidents ───────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql
set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_incidents_updated_at on public.incidents;
create trigger update_incidents_updated_at
  before update on public.incidents
  for each row execute function public.update_updated_at();

-- ── 3. seed editor role idempotently ─────────────────────────────────────────
insert into public.user_roles (name, can_view, can_add, can_edit, can_delete, can_upload, can_manage_people, can_manage_cases, can_invite_users, can_export)
values ('editor', true, true, true, true, true, true, true, false, false)
on conflict (name) do nothing;

-- ── 4. fix lawyer permissions to match frontend (view-only) ──────────────────
update public.user_roles
   set can_add = false, can_edit = false, can_delete = false,
       can_upload = false, can_manage_people = false, can_manage_cases = false,
       can_export = false
 where name = 'lawyer';
