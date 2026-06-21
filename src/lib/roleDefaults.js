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
  },
  editor: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: true,  edit: true,  delete: false,
    upload: true,  managePeople: true,  manageCases: true,
    manageUsers: true,  inviteUsers: false,  export: true,  viewAdmin: true,
    canComment: true,  viewSensitiveNotes: true,
  },
  lawyer: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: false,  edit: false,  delete: false,
    upload: false,  managePeople: false,  manageCases: false,
    manageUsers: false,  inviteUsers: false,  export: false,  viewAdmin: false,
    canComment: true,  viewSensitiveNotes: true,
  },
  viewer: {
    pageIncidents: true,  pagePeople: true,   pageCharges: true,  pageDocuments: true,
    view: true,  add: false,  edit: false,  delete: false,
    upload: false,  managePeople: false,  manageCases: false,
    manageUsers: false,  inviteUsers: false,  export: false,  viewAdmin: false,
    canComment: false,  viewSensitiveNotes: false,
  },
}
