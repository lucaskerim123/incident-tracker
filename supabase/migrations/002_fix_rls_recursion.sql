-- Fix infinite recursion in user_roles RLS policies.
-- All policies that queried user_roles inside user_roles caused recursion.
-- Solution: SECURITY DEFINER function reads user_roles bypassing RLS.

create or replace function get_my_role()
returns user_role language sql security definer stable as $$
  select role from user_roles where user_id = auth.uid() limit 1;
$$;

-- ─── DROP ALL OLD POLICIES ────────────────────────────────────────────────────

-- incidents
drop policy if exists "owner_all"     on incidents;
drop policy if exists "shared_read"   on incidents;
drop policy if exists "shared_insert" on incidents;
drop policy if exists "shared_update" on incidents;

-- people
drop policy if exists "owner_all"      on people;
drop policy if exists "shared_read"    on people;
drop policy if exists "shared_manage"  on people;

-- cases
drop policy if exists "owner_all"     on cases;
drop policy if exists "shared_read"   on cases;
drop policy if exists "shared_manage" on cases;

-- documents
drop policy if exists "owner_all"    on documents;
drop policy if exists "shared_read"  on documents;
drop policy if exists "shared_upload" on documents;

-- user_roles
drop policy if exists "read_own"   on user_roles;
drop policy if exists "admin_all"  on user_roles;

-- invitations
drop policy if exists "admin_all" on invitations;

-- ─── INCIDENTS ────────────────────────────────────────────────────────────────
create policy "owner_all" on incidents
  for all using (user_id = auth.uid());

create policy "shared_read" on incidents
  for select using (get_my_role() is not null);

create policy "shared_insert" on incidents
  for insert with check (get_my_role() in ('lawyer', 'support'));

create policy "shared_update" on incidents
  for update using (get_my_role() = 'lawyer');

-- ─── PEOPLE ──────────────────────────────────────────────────────────────────
create policy "owner_all" on people
  for all using (user_id = auth.uid());

create policy "shared_read" on people
  for select using (get_my_role() is not null);

create policy "shared_manage" on people
  for all using (get_my_role() in ('admin', 'lawyer'));

-- ─── CASES ───────────────────────────────────────────────────────────────────
create policy "owner_all" on cases
  for all using (user_id = auth.uid());

create policy "shared_read" on cases
  for select using (get_my_role() is not null);

create policy "shared_manage" on cases
  for all using (get_my_role() in ('admin', 'lawyer'));

-- ─── DOCUMENTS ───────────────────────────────────────────────────────────────
create policy "owner_all" on documents
  for all using (user_id = auth.uid());

create policy "shared_read" on documents
  for select using (get_my_role() is not null);

create policy "shared_upload" on documents
  for insert with check (get_my_role() in ('admin', 'lawyer', 'support'));

-- ─── USER_ROLES ──────────────────────────────────────────────────────────────
-- read_own: no recursion risk (no join, just uid check)
create policy "read_own" on user_roles
  for select using (user_id = auth.uid());

-- admin_all: use get_my_role() to avoid self-referential recursion
create policy "admin_all" on user_roles
  for all using (user_id = auth.uid() or get_my_role() = 'admin');

-- ─── INVITATIONS ─────────────────────────────────────────────────────────────
create policy "admin_all" on invitations
  for all using (get_my_role() = 'admin' or invited_by = auth.uid());
