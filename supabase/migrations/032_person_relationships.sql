create table public.person_relationships (
  id             uuid primary key default gen_random_uuid(),
  from_person_id uuid not null references public.people(id) on delete cascade,
  to_person_id   uuid not null references public.people(id) on delete cascade,
  label          text not null,
  created_at     timestamptz default now()
);

alter table public.person_relationships enable row level security;

create policy "authenticated read relationships"
  on public.person_relationships for select to authenticated using (true);

create policy "authenticated manage relationships"
  on public.person_relationships for all to authenticated
  using (true) with check (true);
