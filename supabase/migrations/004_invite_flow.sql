-- Add user_code to invitations (pre-assigned so new user knows their ID before signing up)
alter table invitations alter column email drop not null;
alter table invitations add column if not exists user_code text unique default nextval('user_code_seq')::text;

-- Validate an invitation: checks user_code + token match and is not yet accepted
create or replace function validate_invitation(p_user_code text, p_token text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from invitations
    where user_code = p_user_code
    and token = p_token
    and accepted = false
  );
$$;

-- Check if any users exist — used by login page to detect first-time setup
create or replace function has_any_users()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.users);
$$;

-- Reserve the next user_code for first admin signup (only works when no users exist yet)
create or replace function reserve_first_user_code()
returns text language plpgsql security definer as $$
begin
  if exists (select 1 from public.users) then
    raise exception 'Users already exist';
  end if;
  return nextval('user_code_seq')::text;
end;
$$;

-- Updated trigger: extracts user_code from email prefix, matches to pending invitation
drop trigger if exists on_auth_user_created on auth.users;

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_role      text;
  v_user_code text;
  v_invite_id uuid;
begin
  -- Email format is always {user_code}@it.local
  v_user_code := split_part(new.email, '@', 1);

  -- Look for a pending invitation with this user_code
  select id, role into v_invite_id, v_role
  from public.invitations
  where user_code = v_user_code and accepted = false
  limit 1;

  if v_invite_id is not null then
    -- Use invitation role, mark it accepted
    update public.invitations set accepted = true where id = v_invite_id;
  elsif not exists (select 1 from public.users) then
    v_role := 'admin';
  else
    v_role := 'viewer';
  end if;

  insert into public.users (id, email, role, user_code)
  values (new.id, new.email, v_role, v_user_code)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Backfill: create public.users rows for any auth users that pre-date this migration
-- (trigger only fires on NEW signups, so existing accounts need a manual insert)
do $$
declare
  v_first boolean;
  v_rec   record;
  v_code  text;
begin
  v_first := not exists (select 1 from public.users);
  for v_rec in
    select id, email
    from auth.users
    where not exists (select 1 from public.users u where u.id = auth.users.id)
    order by created_at
  loop
    v_code := nextval('user_code_seq')::text;
    insert into public.users (id, email, role, user_code)
    values (v_rec.id, v_rec.email, case when v_first then 'admin' else 'viewer' end, v_code);
    v_first := false;
  end loop;
end;
$$;
