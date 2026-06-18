-- Migration 028: suspend/ban timing, reasons, and dedicated RPCs

-- ── New columns on public.users ───────────────────────────────────────────────
alter table public.users
  add column if not exists suspension_reason     text,
  add column if not exists suspension_expires_at timestamptz,
  add column if not exists ban_reason            text,
  add column if not exists ban_expires_at        timestamptz;

-- ── Enable realtime on users table ───────────────────────────────────────────
alter publication supabase_realtime add table public.users;

-- ── check_and_clear_expired_restrictions ─────────────────────────────────────
-- Auto-lifts expired suspensions/bans, returns the effective status.
-- Called at fetchRole time so clients always see a canonical status.
create or replace function public.check_and_clear_expired_restrictions(target_id uuid)
returns text language plpgsql security definer
set search_path = public as $$
declare
  v_status             text;
  v_suspension_expires timestamptz;
  v_ban_expires        timestamptz;
begin
  select status, suspension_expires_at, ban_expires_at
    into v_status, v_suspension_expires, v_ban_expires
    from public.users
   where id = target_id;

  if v_status = 'suspended'
     and v_suspension_expires is not null
     and v_suspension_expires < now() then
    update public.users
       set status = 'active',
           suspension_reason = null,
           suspension_expires_at = null
     where id = target_id;
    return 'active';
  end if;

  if v_status = 'blocked'
     and v_ban_expires is not null
     and v_ban_expires < now() then
    update public.users
       set status = 'active',
           ban_reason = null,
           ban_expires_at = null
     where id = target_id;
    return 'active';
  end if;

  return coalesce(v_status, 'pending');
end;
$$;

grant execute on function public.check_and_clear_expired_restrictions(uuid) to authenticated;

-- ── suspend_user ──────────────────────────────────────────────────────────────
create or replace function public.suspend_user(
  target_id  uuid,
  reason     text default null,
  expires_at timestamptz default null
)
returns void language plpgsql security definer
set search_path = public as $$
declare v_target_role text;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  select role into v_target_role from public.users where id = target_id;
  if v_target_role = 'admin' then
    raise exception 'Cannot suspend an admin';
  end if;
  update public.users
     set status                = 'suspended',
         suspension_reason     = reason,
         suspension_expires_at = expires_at,
         ban_reason            = null,
         ban_expires_at        = null
   where id = target_id;
end;
$$;

grant execute on function public.suspend_user(uuid, text, timestamptz) to authenticated;

-- ── unsuspend_user ────────────────────────────────────────────────────────────
create or replace function public.unsuspend_user(target_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  update public.users
     set status = 'active',
         suspension_reason = null,
         suspension_expires_at = null
   where id = target_id and status = 'suspended';
end;
$$;

grant execute on function public.unsuspend_user(uuid) to authenticated;

-- ── ban_user ──────────────────────────────────────────────────────────────────
create or replace function public.ban_user(
  target_id  uuid,
  reason     text default null,
  expires_at timestamptz default null
)
returns void language plpgsql security definer
set search_path = public as $$
declare v_target_role text;
begin
  if get_my_role() != 'admin' then
    raise exception 'Unauthorized: admin only';
  end if;
  select role into v_target_role from public.users where id = target_id;
  if v_target_role = 'admin' then
    raise exception 'Cannot ban an admin';
  end if;
  update public.users
     set status                = 'blocked',
         ban_reason            = reason,
         ban_expires_at        = expires_at,
         suspension_reason     = null,
         suspension_expires_at = null
   where id = target_id;
end;
$$;

grant execute on function public.ban_user(uuid, text, timestamptz) to authenticated;

-- ── unban_user ────────────────────────────────────────────────────────────────
create or replace function public.unban_user(target_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Unauthorized: admin only';
  end if;
  update public.users
     set status = 'active',
         ban_reason = null,
         ban_expires_at = null
   where id = target_id and status = 'blocked';
end;
$$;

grant execute on function public.unban_user(uuid) to authenticated;
