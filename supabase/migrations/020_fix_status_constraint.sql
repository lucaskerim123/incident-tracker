-- Migration 020: expand status check constraint to include suspended and blocked
alter table public.users
  drop constraint if exists users_status_check;

alter table public.users
  add constraint users_status_check
  check (status = any (array['pending', 'active', 'suspended', 'blocked']));
