-- ─── TEARDOWN ────────────────────────────────────────────────────────────────
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user()             cascade;
drop function if exists get_my_role()                 cascade;
drop function if exists caller_has_role(user_role)    cascade;
drop function if exists get_owner_ids()               cascade;

drop table if exists invitations  cascade;
drop table if exists documents    cascade;
drop table if exists cases        cascade;
drop table if exists people       cascade;
drop table if exists incidents    cascade;
drop table if exists user_roles   cascade;

drop type if exists incident_category cascade;
drop type if exists incident_status   cascade;
drop type if exists user_role         cascade;

drop sequence if exists user_code_seq;

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── SEQUENCES ───────────────────────────────────────────────────────────────
create sequence user_code_seq start 1000;

-- ─── ENUMS ───────────────────────────────────────────────────────────────────
create type incident_category as enum ('legal','mental_health','police','court','avo','other');
create type incident_status   as enum ('documented','pending','resolved');
create type user_role         as enum ('admin','lawyer','support','viewer');

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- One row per registered user. Auto-populated by trigger on auth.users insert.
create table user_roles (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  user_code  text        not null default nextval('user_code_seq')::text,
  role       user_role   not null default 'viewer',
  email      text,
  invited_by uuid        references auth.users(id),
  created_at timestamptz not null default now(),
  unique(user_id),
  unique(user_code)
);

create table incidents (
  id               uuid              primary key default gen_random_uuid(),
  user_id          uuid              not null references auth.users(id) on delete cascade,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  name    text not null,
  role    text,
  dob     date,
  notes   text
);

create table cases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  case_number    text,
  charge         text not null,
  status         text not null default 'active',
  court_date     date,
  court_location text,
  notes          text
);

create table documents (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
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
  role       user_role   not null default 'viewer',
  token      text        not null unique default gen_random_uuid()::text,
  invited_by uuid        references auth.users(id),
  accepted   boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index on incidents  (user_id, date desc);
create index on incidents  (user_id, category);
create index on people     (user_id);
create index on cases      (user_id, status);
create index on documents  (user_id);
create index on user_roles (user_id);
create index on user_roles (user_code);

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────

-- Reads the calling user's role bypassing RLS (prevents recursion in policies).
create or replace function get_my_role()
returns user_role language sql security definer stable as $$
  select role from user_roles where user_id = auth.uid() limit 1;
$$;

-- Auto-assigns user_code + role when a new auth user is created.
-- First user ever → admin. All subsequent users → viewer.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_roles (user_id, role, email, user_code)
  values (
    new.id,
    case
      when not exists (select 1 from public.user_roles)
      then 'admin'::user_role
      else 'viewer'::user_role
    end,
    new.email,
    nextval('user_code_seq')::text
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table incidents   enable row level security;
alter table people      enable row level security;
alter table cases       enable row level security;
alter table documents   enable row level security;
alter table user_roles  enable row level security;
alter table invitations enable row level security;

-- INCIDENTS
-- owner (the person who created it) can do everything
create policy "owner_all" on incidents
  for all using (user_id = auth.uid());
-- any user with a role can read
create policy "shared_read" on incidents
  for select using (get_my_role() is not null);
-- lawyer or support can add
create policy "shared_insert" on incidents
  for insert with check (get_my_role() in ('lawyer','support'));
-- lawyer can edit
create policy "shared_update" on incidents
  for update using (get_my_role() = 'lawyer');

-- PEOPLE
create policy "owner_all" on people
  for all using (user_id = auth.uid());
create policy "shared_read" on people
  for select using (get_my_role() is not null);
create policy "shared_manage" on people
  for all using (get_my_role() in ('admin','lawyer'));

-- CASES
create policy "owner_all" on cases
  for all using (user_id = auth.uid());
create policy "shared_read" on cases
  for select using (get_my_role() is not null);
create policy "shared_manage" on cases
  for all using (get_my_role() in ('admin','lawyer'));

-- DOCUMENTS
create policy "owner_all" on documents
  for all using (user_id = auth.uid());
create policy "shared_read" on documents
  for select using (get_my_role() is not null);
create policy "shared_upload" on documents
  for insert with check (get_my_role() in ('admin','lawyer','support'));

-- USER_ROLES
-- anyone can read their own row
create policy "read_own" on user_roles
  for select using (user_id = auth.uid());
-- admin can read/write all rows; any user can update their own
create policy "admin_all" on user_roles
  for all using (user_id = auth.uid() or get_my_role() = 'admin');

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
