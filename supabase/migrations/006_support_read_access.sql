-- Allow support role to read all users and pending invitations (Admin panel view-only mode)
create policy "support_read_users" on public.users
  for select
  using (get_my_role() in ('admin', 'support'));

create policy "support_read_invitations" on public.invitations
  for select
  using (get_my_role() in ('admin', 'support'));
