-- Expand documents table
alter table public.documents
  add column if not exists related_case_id uuid references public.cases(id) on delete set null,
  add column if not exists restricted boolean not null default false,
  add column if not exists description text;

-- Recreate shared_read policy to hide restricted docs from viewers
drop policy if exists "shared_read" on public.documents;
create policy "shared_read" on public.documents
  for select using (
    can_do('view') and (
      not restricted
      or get_my_role() in ('editor', 'admin')
    )
  );
