-- Expand incidents table with new fields
alter table public.incidents
  add column if not exists incident_time time,
  add column if not exists location text,
  add column if not exists severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  add column if not exists evidence_notes text,
  add column if not exists linked_case_id uuid references public.cases(id) on delete set null;

-- Comments table: lawyer+ can post, all logged-in users can read
create table if not exists public.incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_code text,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.incident_comments enable row level security;

create policy "comments_read" on public.incident_comments
  for select using (get_my_role() is not null);

create policy "comments_insert" on public.incident_comments
  for insert with check (get_my_role() in ('lawyer', 'editor', 'admin'));

create policy "comments_delete" on public.incident_comments
  for delete using (
    get_my_role() = 'admin' or user_id = auth.uid()
  );

-- People: add status to distinguish confirmed vs awaiting review
alter table public.people
  add column if not exists status text not null default 'confirmed'
  check (status in ('confirmed', 'awaiting_review'));

update public.people set status = 'confirmed' where status is null;
