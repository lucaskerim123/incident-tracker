-- Prevent users from escalating their own role via direct API call.
-- The original update_own policy had no WITH CHECK on role, meaning any
-- authenticated user could PATCH their own role to 'admin' via the REST API.
drop policy if exists "update_own" on public.users;

create policy "update_own" on public.users
  for update
  using  (id = auth.uid())
  with check (id = auth.uid() and role = get_my_role());

-- Index: IncidentDetail queries documents by related_incident_id on every load.
-- Without this, it's a full table scan.
create index if not exists idx_documents_incident_id
  on public.documents (related_incident_id);

-- Index: Settings page filters invitations by accepted = false.
-- Partial index keeps it tiny and fast.
create index if not exists idx_invitations_pending
  on public.invitations (created_at)
  where accepted = false;

-- Fix: invitations.invited_by had no ON DELETE action, leaving orphaned rows
-- when an admin account is deleted. Set null instead.
alter table public.invitations
  drop constraint if exists invitations_invited_by_fkey;

alter table public.invitations
  add constraint invitations_invited_by_fkey
  foreign key (invited_by) references public.users(id) on delete set null;

-- Data integrity: users.email should be unique. auth.users already enforces this
-- via the {user_code}@it.local scheme, but the public.users table didn't.
do $$ begin
  alter table public.users add constraint users_email_unique unique (email);
exception when duplicate_object then null;
end $$;
