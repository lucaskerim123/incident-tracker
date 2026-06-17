-- ─── TEARDOWN ────────────────────────────────────────────────────────────────
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user()             cascade;
drop function if exists get_my_role()                 cascade;
drop function if exists can_do(text)                  cascade;
drop function if exists caller_has_role(user_role)    cascade;
drop function if exists get_owner_ids()               cascade;

drop table if exists invitations cascade;
drop table if exists documents   cascade;
drop table if exists cases       cascade;
drop table if exists people      cascade;
drop table if exists incidents   cascade;
drop table if exists users       cascade;
drop table if exists user_roles  cascade;

drop type if exists incident_category cascade;
drop type if exists incident_status   cascade;
drop type if exists user_role         cascade;

drop sequence if exists user_code_seq;

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── SEQUENCES ───────────────────────────────────────────────────────────────
-- User codes start at 1000. First registered user = 1000.
create sequence user_code_seq start 1000;

-- ─── ENUMS ───────────────────────────────────────────────────────────────────
create type incident_category as enum ('legal','mental_health','police','court','avo','other');
create type incident_status   as enum ('documented','pending','resolved');

-- ─── USER_ROLES — defines what each role is allowed to do ────────────────────
create table user_roles (
  id                uuid    primary key default gen_random_uuid(),
  name              text    not null unique,
  can_view          boolean not null default true,
  can_add           boolean not null default false,
  can_edit          boolean not null default false,
  can_delete        boolean not null default false,
  can_upload        boolean not null default false,
  can_manage_people boolean not null default false,
  can_manage_cases  boolean not null default false,
  can_invite_users  boolean not null default false,
  can_export        boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Seed the 4 default roles
insert into user_roles (name, can_view, can_add, can_edit, can_delete, can_upload, can_manage_people, can_manage_cases, can_invite_users, can_export) values
  ('admin',   true, true,  true,  true,  true,  true,  true,  true,  true),
  ('lawyer',  true, true,  true,  false, true,  true,  true,  false, true),
  ('support', true, true,  false, false, true,  false, false, false, false),
  ('viewer',  true, false, false, false, false, false, false, false, false);

-- ─── USERS — app profile, linked 1:1 to auth.users ───────────────────────────
create table users (
  id           uuid        primary key references auth.users(id) on delete cascade,
  user_code    text        not null unique default nextval('user_code_seq')::text,
  email        text        not null,
  display_name text,
  role         text        not null default 'viewer' references user_roles(name),
  invited_by   uuid        references users(id),
  created_at   timestamptz not null default now()
);

create index on users (user_code);
create index on users (role);

-- ─── CORE TABLES ─────────────────────────────────────────────────────────────

create table incidents (
  id               uuid              primary key default gen_random_uuid(),
  user_id          uuid              not null references users(id) on delete cascade,
  date             date              not null,
  title            text              not null,
  category         incident_category not null default 'other',
  description      text              not null default '',
  people_involved  text[]            not null default '{}',
  outcome          text,
  reference_number text,
  status           incident_status   not null default 'documented',
  created_at       timestamptz       not null default now(),
  updated_at       timestamptz       not null default now()
);

create table people (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name    text not null,
  role    text,
  dob     date,
  notes   text
);

create table cases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  case_number    text,
  charge         text not null,
  status         text not null default 'active',
  court_date     date,
  court_location text,
  notes          text
);

create table documents (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references users(id) on delete cascade,
  title               text        not null,
  file_path           text,
  google_doc_id       text,
  category            text        not null default 'other',
  related_incident_id uuid        references incidents(id) on delete set null,
  created_at          timestamptz not null default now()
);

create table invitations (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  role       text        not null default 'viewer' references user_roles(name),
  token      text        not null unique default gen_random_uuid()::text,
  invited_by uuid        references users(id),
  accepted   boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index on incidents (user_id, date desc);
create index on incidents (user_id, category);
create index on people    (user_id);
create index on cases     (user_id, status);
create index on documents (user_id);

-- ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

-- Returns the current user's role name, bypassing RLS (prevents recursion).
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from users where id = auth.uid() limit 1;
$$;

-- Returns true if the current user has a specific permission.
create or replace function can_do(action text)
returns boolean language sql security definer stable as $$
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

-- Auto-creates a users row when someone signs up via Supabase Auth.
-- First user ever → admin + user_code 1000.
-- All subsequent users → viewer + next user_code.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, role, user_code)
  values (
    new.id,
    new.email,
    case
      when not exists (select 1 from public.users)
      then 'admin'
      else 'viewer'
    end,
    nextval('user_code_seq')::text
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table users       enable row level security;
alter table user_roles  enable row level security;
alter table incidents   enable row level security;
alter table people      enable row level security;
alter table cases       enable row level security;
alter table documents   enable row level security;
alter table invitations enable row level security;

-- USERS
-- Anyone can read their own profile
create policy "read_own" on users
  for select using (id = auth.uid());
-- Admins can read all users
create policy "admin_read_all" on users
  for select using (get_my_role() = 'admin');
-- Users can update their own display_name only (not role or user_code)
create policy "update_own" on users
  for update using (id = auth.uid());
-- Only admins can change roles / manage other users
create policy "admin_manage" on users
  for all using (get_my_role() = 'admin');

-- USER_ROLES (permission definitions)
-- Everyone authenticated can read role definitions (needed for permission checks)
create policy "all_read" on user_roles
  for select using (auth.uid() is not null);
-- Only admins can create/edit/delete roles
create policy "admin_manage" on user_roles
  for all using (get_my_role() = 'admin');

-- INCIDENTS
create policy "owner_all" on incidents
  for all using (user_id = auth.uid());
create policy "shared_read" on incidents
  for select using (can_do('view'));
create policy "shared_insert" on incidents
  for insert with check (can_do('add'));
create policy "shared_update" on incidents
  for update using (can_do('edit'));
create policy "shared_delete" on incidents
  for delete using (can_do('delete'));

-- PEOPLE
create policy "owner_all" on people
  for all using (user_id = auth.uid());
create policy "shared_read" on people
  for select using (can_do('view'));
create policy "shared_manage" on people
  for all using (can_do('manage_people'));

-- CASES
create policy "owner_all" on cases
  for all using (user_id = auth.uid());
create policy "shared_read" on cases
  for select using (can_do('view'));
create policy "shared_manage" on cases
  for all using (can_do('manage_cases'));

-- DOCUMENTS
create policy "owner_all" on documents
  for all using (user_id = auth.uid());
create policy "shared_read" on documents
  for select using (can_do('view'));
create policy "shared_upload" on documents
  for insert with check (can_do('upload'));
create policy "shared_delete" on documents
  for delete using (can_do('delete'));

-- INVITATIONS (admin only)
create policy "admin_all" on invitations
  for all using (get_my_role() = 'admin' or invited_by = auth.uid());

-- ─── STORAGE BUCKET ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict do nothing;

drop policy if exists "auth_upload"  on storage.objects;
drop policy if exists "owner_read"   on storage.objects;
drop policy if exists "owner_delete" on storage.objects;

create policy "auth_upload" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "owner_read" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owner_delete" on storage.objects
  for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
