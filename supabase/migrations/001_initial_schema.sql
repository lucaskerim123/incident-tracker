-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── TYPES ───────────────────────────────────────────────────────────────────
create type incident_category as enum ('legal','mental_health','police','court','avo','other');
create type incident_status    as enum ('documented','pending','resolved');
create type user_role          as enum ('admin','lawyer','support','readonly');

-- ─── TABLES ──────────────────────────────────────────────────────────────────

create table incidents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null,
  title            text not null,
  category         incident_category not null default 'other',
  description      text not null default '',
  people_involved  text[] not null default '{}',
  outcome          text,
  reference_number text,
  status           incident_status not null default 'documented',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
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
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  file_path           text,
  google_doc_id       text,
  category            text not null default 'other',
  related_incident_id uuid references incidents(id) on delete set null,
  created_at          timestamptz not null default now()
);

create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id),
  role       user_role not null default 'readonly',
  email      text,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table invitations (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  role       user_role not null default 'readonly',
  token      text not null unique default gen_random_uuid()::text,
  invited_by uuid references auth.users(id),
  accepted   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index on incidents (user_id, date desc);
create index on incidents (user_id, category);
create index on people    (user_id);
create index on cases     (user_id, status);
create index on documents (user_id);
create index on user_roles (user_id);

-- ─── HELPER: check if caller has a role ──────────────────────────────────────
create or replace function caller_has_role(required_role user_role)
returns boolean language sql security definer as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

-- ─── HELPER: owner of a record ───────────────────────────────────────────────
-- Returns the user_id of the first admin — used for cross-user read access
create or replace function get_owner_ids()
returns setof uuid language sql security definer as $$
  select distinct user_id from user_roles where role = 'admin'
  union
  select id from auth.users where id = auth.uid()
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

alter table incidents   enable row level security;
alter table people      enable row level security;
alter table cases       enable row level security;
alter table documents   enable row level security;
alter table user_roles  enable row level security;
alter table invitations enable row level security;

-- INCIDENTS
-- Owner: full CRUD
create policy "owner_all" on incidents for all using (user_id = auth.uid());
-- Shared users: read (any role) + insert (lawyer/support) + update (lawyer)
create policy "shared_read" on incidents for select using (
  exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role != 'readonly')
  or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'readonly')
);
create policy "shared_insert" on incidents for insert with check (
  exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role in ('lawyer','support'))
);
create policy "shared_update" on incidents for update using (
  exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'lawyer')
);

-- PEOPLE
create policy "owner_all" on people for all using (user_id = auth.uid());
create policy "shared_read" on people for select using (
  exists (select 1 from user_roles where user_id = auth.uid())
);
create policy "shared_manage" on people for all using (
  exists (select 1 from user_roles where user_id = auth.uid() and role in ('admin','lawyer'))
);

-- CASES
create policy "owner_all" on cases for all using (user_id = auth.uid());
create policy "shared_read" on cases for select using (
  exists (select 1 from user_roles where user_id = auth.uid())
);
create policy "shared_manage" on cases for all using (
  exists (select 1 from user_roles where user_id = auth.uid() and role in ('admin','lawyer'))
);

-- DOCUMENTS
create policy "owner_all" on documents for all using (user_id = auth.uid());
create policy "shared_read" on documents for select using (
  exists (select 1 from user_roles where user_id = auth.uid())
);
create policy "shared_upload" on documents for insert with check (
  exists (select 1 from user_roles where user_id = auth.uid() and role in ('admin','lawyer','support'))
);

-- USER_ROLES (admin only writes, any authenticated reads own)
create policy "read_own" on user_roles for select using (user_id = auth.uid());
create policy "admin_all" on user_roles for all using (
  exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  or user_id = auth.uid()
);

-- INVITATIONS (admin only)
create policy "admin_all" on invitations for all using (
  exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  or invited_by = auth.uid()
);

-- ─── STORAGE BUCKET ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict do nothing;

create policy "auth_upload" on storage.objects for insert with check (
  bucket_id = 'documents' and auth.role() = 'authenticated'
);
create policy "owner_read" on storage.objects for select using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "owner_delete" on storage.objects for delete using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
