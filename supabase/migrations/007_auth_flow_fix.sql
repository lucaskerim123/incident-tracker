-- ─── 1. Align role names: rename 'support' → 'editor' with editor permissions ──
update user_roles set
  name              = 'editor',
  can_edit          = true,
  can_delete        = true,
  can_manage_people = true,
  can_manage_cases  = true
where name = 'support';

-- Update any existing users who had the old role
update users set role = 'editor' where role = 'support';

-- ─── 2. Fix invitations table ────────────────────────────────────────────────
-- Add pre-allocated user_code (pulled from the same sequence as users.user_code)
alter table invitations
  add column if not exists user_code text unique default nextval('user_code_seq')::text;

-- email was NOT NULL but we never use email-based invites — make it nullable
alter table invitations alter column email drop not null;
alter table invitations alter column email set default null;

-- ─── 3. validate_invitation(user_code, token) → boolean ─────────────────────
-- Called before signup to confirm the invite is real and unused.
create or replace function validate_invitation(p_user_code text, p_token text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.invitations
    where user_code = p_user_code
      and token     = p_token
      and accepted  = false
  );
$$;

-- ─── 4. has_any_users() → boolean ───────────────────────────────────────────
-- Used on the register screen: if false, first-user path skips invite check.
create or replace function has_any_users()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.users limit 1);
$$;

-- ─── 5. Rewrite handle_new_user trigger ─────────────────────────────────────
-- • Invited user  → user_code and role come from the matching invitation;
--                   invitation is marked accepted.
-- • First user    → user_code from sequence, role = 'admin'.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_invite record;
  v_code   text;
  v_role   text;
begin
  -- Parse user_code out of email: format is {user_code}@it.local
  v_code := split_part(new.email, '@', 1);

  select * into v_invite
  from public.invitations
  where user_code = v_code
    and accepted  = false
  limit 1;

  if found then
    -- Invited user: use invite's pre-allocated code and role
    v_role := v_invite.role;
    update public.invitations set accepted = true where id = v_invite.id;
    insert into public.users (id, email, user_code, role)
    values (new.id, new.email, v_code, v_role);
  else
    -- First user (no matching invite): assign admin, get next sequence value
    insert into public.users (id, email, user_code, role)
    values (new.id, new.email, nextval('user_code_seq')::text, 'admin');
  end if;

  return new;
end;
$$;

-- ─── 6. Fix update_own policy — prevent self role-escalation ────────────────
drop policy if exists "update_own" on public.users;
create policy "update_own" on public.users
  for update
  using  (id = auth.uid())
  with check (id = auth.uid() and role = get_my_role());

-- ─── 7. Performance indexes ──────────────────────────────────────────────────
create index if not exists idx_documents_incident_id
  on public.documents (related_incident_id);

create index if not exists idx_invitations_pending
  on public.invitations (created_at)
  where accepted = false;

-- Fix invited_by FK so deleting an admin doesn't orphan invitations
alter table public.invitations
  drop constraint if exists invitations_invited_by_fkey;
alter table public.invitations
  add constraint invitations_invited_by_fkey
  foreign key (invited_by) references public.users(id) on delete set null;
