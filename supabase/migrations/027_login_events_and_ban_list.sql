-- Migration 027: login_events table + ban_list table + security RPCs

-- ── login_events ──────────────────────────────────────────────────────────────
create table if not exists public.login_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.login_events enable row level security;

create policy "admins view login events"
  on public.login_events for select
  to authenticated
  using (get_my_role() in ('admin', 'editor'));

-- ── ban_list ──────────────────────────────────────────────────────────────────
create table if not exists public.ban_list (
  id         uuid        primary key default gen_random_uuid(),
  type       text        not null check (type in ('email', 'ip', 'user')),
  value      text        not null,
  reason     text,
  banned_by  uuid        references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active  boolean     not null default true
);

alter table public.ban_list enable row level security;

create policy "admins view ban list"
  on public.ban_list for select
  to authenticated
  using (get_my_role() in ('admin', 'editor'));

-- ── log_login_event ───────────────────────────────────────────────────────────
create or replace function public.log_login_event(p_ip text, p_user_agent text)
returns void language plpgsql security definer
set search_path = public as $$
begin
  insert into public.login_events (user_id, ip_address, user_agent)
  values (auth.uid(), p_ip, p_user_agent);
end;
$$;

grant execute on function public.log_login_event(text, text) to authenticated;

-- ── add_ban ───────────────────────────────────────────────────────────────────
create or replace function public.add_ban(
  p_type     text,
  p_value    text,
  p_reason   text default null,
  p_expires_at timestamptz default null
)
returns uuid language plpgsql security definer
set search_path = public as $$
declare v_id uuid;
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  insert into public.ban_list (type, value, reason, banned_by, expires_at)
  values (p_type, lower(trim(p_value)), p_reason, auth.uid(), p_expires_at)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.add_ban(text, text, text, timestamptz) to authenticated;

-- ── remove_ban ────────────────────────────────────────────────────────────────
create or replace function public.remove_ban(p_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  update public.ban_list set is_active = false where id = p_id;
end;
$$;

grant execute on function public.remove_ban(uuid) to authenticated;

-- ── get_user_login_history ────────────────────────────────────────────────────
create or replace function public.get_user_login_history(p_user_id uuid)
returns table (id uuid, ip_address text, user_agent text, created_at timestamptz)
language plpgsql security definer
set search_path = public as $$
begin
  if get_my_role() not in ('admin', 'editor') then
    raise exception 'Unauthorized';
  end if;
  return query
  select le.id, le.ip_address, le.user_agent, le.created_at
  from public.login_events le
  where le.user_id = p_user_id
  order by le.created_at desc
  limit 20;
end;
$$;

grant execute on function public.get_user_login_history(uuid) to authenticated;
