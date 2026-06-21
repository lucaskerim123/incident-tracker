// Hardcoded default permissions per role.
// Imported by both usePermissions.js and RolePermissionsContext.jsx
// to avoid circular dependencies.

export const DEFAULT_PERMISSIONS = {
  admin: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: true,  edit: true,  delete: true,
    upload: true,  managePeople: true,  manageCases: true,
    manageUsers: true,  inviteUsers: true,  export: true,  viewAdmin: true,
    canComment: true,  viewSensitiveNotes: true,
    createUser: true,  editUser: true,  changeUserRole: true,
    suspendUser: true,  banUser: true,  resetUserPassword: true,
  },
  editor: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: true,  edit: true,  delete: false,
    upload: true,  managePeople: true,  manageCases: true,
    manageUsers: true,  inviteUsers: false,  export: true,  viewAdmin: true,
    canComment: true,  viewSensitiveNotes: true,
    createUser: true,  editUser: true,  changeUserRole: false,
    suspendUser: true,  banUser: false,  resetUserPassword: false,
  },
  lawyer: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: false,  edit: false,  delete: false,
    upload: false,  managePeople: false,  manageCases: false,
    manageUsers: false,  inviteUsers: false,  export: false,  viewAdmin: false,
    canComment: true,  viewSensitiveNotes: true,
    createUser: false,  editUser: false,  changeUserRole: false,
    suspendUser: false,  banUser: false,  resetUserPassword: false,
  },
  viewer: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: false,  edit: false,  delete: false,
    upload: false,  managePeople: false,  manageCases: false,
    manageUsers: false,  inviteUsers: false,  export: false,  viewAdmin: false,
    canComment: false,  viewSensitiveNotes: false,
    createUser: false,  editUser: false,  changeUserRole: false,
    suspendUser: false,  banUser: false,  resetUserPassword: false,
  },
}
