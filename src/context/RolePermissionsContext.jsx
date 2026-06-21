import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_PERMISSIONS } from '../lib/roleDefaults'

export const RolePermissionsContext = createContext(null)

export function RolePermissionsProvider({ children }) {
  const [overrides, setOverrides] = useState({})   // { role: { permission: bool } }
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase.from('role_permissions').select('role, permission, enabled')
    if (data) {
      const map = {}
      for (const row of data) {
        if (!map[row.role]) map[row.role] = {}
        map[row.role][row.permission] = row.enabled
      }
      setOverrides(map)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Realtime: changes from another admin session propagate immediately
  useEffect(() => {
    const channel = supabase.channel('role-permissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Merge DB overrides on top of hardcoded defaults for a role
  const getPermissions = (role) => {
    const base = DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS.viewer
    const roleOverrides = overrides[role] ?? {}
    return { ...base, ...roleOverrides }
  }

  const setPermission = async (role, permission, enabled) => {
    // Optimistic update
    setOverrides(prev => ({
      ...prev,
      [role]: { ...(prev[role] ?? {}), [permission]: enabled },
    }))
    const { error } = await supabase.from('role_permissions').upsert(
      { role, permission, enabled },
      { onConflict: 'role,permission' }
    )
    if (error) {
      // Roll back optimistic update on failure
      setOverrides(prev => ({
        ...prev,
        [role]: { ...(prev[role] ?? {}), [permission]: !enabled },
      }))
    }
  }

  return (
    <RolePermissionsContext.Provider value={{ getPermissions, setPermission, overrides, loading }}>
      {children}
    </RolePermissionsContext.Provider>
  )
}

export function useRolePermissionsContext() {
  return useContext(RolePermissionsContext)
}
