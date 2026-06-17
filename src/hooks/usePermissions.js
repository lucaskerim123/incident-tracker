import { useAuth } from './useAuth'

const PERMISSIONS = {
  admin:    { view: true,  add: true,  edit: true,  delete: true,  upload: true,  managePeople: true,  manageCases: true,  inviteUsers: true,  export: true  },
  lawyer:   { view: true,  add: true,  edit: true,  delete: false, upload: true,  managePeople: true,  manageCases: true,  inviteUsers: false, export: true  },
  support:  { view: true,  add: true,  edit: false, delete: false, upload: true,  managePeople: false, manageCases: false, inviteUsers: false, export: false },
  readonly: { view: true,  add: false, edit: false, delete: false, upload: false, managePeople: false, manageCases: false, inviteUsers: false, export: false },
}

export function usePermissions() {
  const { userRole } = useAuth()
  const role = userRole ?? 'readonly'
  return {
    role,
    isAdmin: role === 'admin',
    can: PERMISSIONS[role] ?? PERMISSIONS.readonly,
  }
}
