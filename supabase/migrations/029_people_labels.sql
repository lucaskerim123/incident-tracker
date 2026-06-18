alter table public.people
  add column if not exists labels           text[] default '{}',
  add column if not exists associate_labels text[] default '{}',
  add column if not exists legal_update     text,
  add column if not exists profile_url      text;
