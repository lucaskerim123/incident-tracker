import { useAuth } from './useAuth'

const PERMISSIONS = {
  admin: {
    view: true, add: true, edit: true, delete: true,
    upload: true, managePeople: true, manageCases: true,
    manageUsers: true, inviteUsers: true, export: true, viewAdmin: true,
  },
  editor: {
    view: true, add: true, edit: true, delete: true,
    upload: true, managePeople: true, manageCases: true,
    manageUsers: true, inviteUsers: false, export: true, viewAdmin: true,
  },
  lawyer: {
    view: true, add: true, edit: false, delete: false,
    upload: true, managePeople: false, manageCases: false,
    manageUsers: false, inviteUsers: false, export: false, viewAdmin: false,
  },
  viewer: {
    view: true, add: false, edit: false, delete: false,
    upload: false, managePeople: false, manageCases: false,
    manageUsers: false, inviteUsers: false, export: false, viewAdmin: false,
  },
}

export const ROLE_LABELS = {
  admin:  'Admin',
  editor: 'Editor',
  lawyer: 'Lawyer',
  viewer: 'Viewer',
}

export const ROLE_STYLES = {
  admin:  { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  editor: { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c' },
  lawyer: { bg: 'rgba(16,185,129,0.15)',  text: '#34d399' },
  viewer: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

export function usePermissions() {
  const { userRole } = useAuth()
  const role = userRole ?? 'viewer'
  return {
    role,
    isAdmin: role === 'admin',
    isEditor: role === 'editor' || role === 'admin',
    can: PERMISSIONS[role] ?? PERMISSIONS.viewer,
  }
}
