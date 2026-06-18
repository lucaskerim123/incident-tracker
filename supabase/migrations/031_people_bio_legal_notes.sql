alter table public.people
  add column if not exists bio         text,
  add column if not exists legal_notes text;
