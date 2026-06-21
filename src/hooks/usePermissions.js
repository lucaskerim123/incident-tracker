import { useContext } from 'react'
import { useAuth } from './useAuth'
import { RolePermissionsContext } from '../context/RolePermissionsContext'
import { DEFAULT_PERMISSIONS } from '../lib/roleDefaults'

// ─── Master permission registry ───────────────────────────────────────────────
// Add a new key here and it automatically appears in the Role Permissions editor.
// Admin permissions are always full-access and are never stored in / read from DB.

export const PERMISSION_DEFS = {
  // ── Page visibility ──
  pageIncidents:      { label: 'View Incidents page',           group: 'Pages' },
  pagePeople:         { label: 'View People page',              group: 'Pages' },
  pageCharges:        { label: 'View Charges / AVO page',       group: 'Pages' },
  pageDocuments:      { label: 'View Documents page',           group: 'Pages' },

  // ── Record actions ──
  view:               { label: 'View records',                  group: 'Records' },
  add:                { label: 'Add new records',               group: 'Records' },
  edit:               { label: 'Edit existing records',         group: 'Records' },
  delete:             { label: 'Delete records',                group: 'Records' },

  // ── Data ──
  upload:             { label: 'Upload documents',              group: 'Data' },
  export:             { label: 'Export / download data',        group: 'Data' },
  canComment:         { label: 'Post comments on incidents',    group: 'Data' },
  viewSensitiveNotes: { label: 'View restricted / legal notes', group: 'Data' },

  // ── People ──
  managePeople:       { label: 'Create & edit people',          group: 'People' },

  // ── Cases / charges ──
  manageCases:        { label: 'Create & edit charges & orders', group: 'Cases' },

  // ── Admin ──
  manageUsers:        { label: 'Manage users (suspend, ban)',   group: 'Admin' },
  inviteUsers:        { label: 'Invite new users',              group: 'Admin' },
  viewAdmin:          { label: 'Access the Admin section',      group: 'Admin' },
  createUser:         { label: 'Create new users',              group: 'Admin' },
  editUser:           { label: 'Edit user profile (name, email)', group: 'Admin' },
  changeUserRole:     { label: "Change a user's role",          group: 'Admin' },
  suspendUser:        { label: 'Suspend / Unsuspend users',     group: 'Admin' },
  banUser:            { label: 'Ban / Unban users',             group: 'Admin' },
  resetUserPassword:  { label: 'Reset user passwords',          group: 'Admin' },
}

export { DEFAULT_PERMISSIONS }

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
  const ctx = useContext(RolePermissionsContext)

  let can
  if (role === 'admin' || !ctx) {
    // Admin always uses hardcoded full-access; never customisable from DB
    can = DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS.viewer
  } else {
    can = ctx.getPermissions(role)
  }

  return {
    role,
    isAdmin: role === 'admin',
    isEditor: role === 'editor' || role === 'admin',
    can,
  }
}
