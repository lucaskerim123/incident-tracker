import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { usePermissions } from './usePermissions'

const DEFAULTS = {
  registration_enabled: 'true',
  auto_approve_registrations: 'false',
  feature_incidents: 'true',
  feature_people: 'true',
  feature_cases: 'true',
  feature_documents: 'true',
  help_message: '',
  help_email: '',
}

export function useAppSettings() {
  const { isAdmin } = usePermissions()
  const [raw, setRaw] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const keys = isAdmin
      ? null // fetch all
      : ['help_message', 'help_email']

    const query = supabase.from('app_settings').select('key, value')
    const filtered = keys ? query.in('key', keys) : query

    filtered.then(({ data }) => {
      if (data) {
        const map = { ...DEFAULTS }
        data.forEach(row => { map[row.key] = row.value })
        setRaw(map)
      }
      setLoading(false)
    })
  }, [isAdmin])

  const updateSetting = useCallback(async (key, value) => {
    const { error } = await supabase
      .from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
    if (!error) setRaw(s => ({ ...s, [key]: value }))
    return { error }
  }, [])

  // Parse 'true'/'false' strings to booleans; leave other strings as-is
  const settings = {}
  for (const [k, v] of Object.entries(raw)) {
    settings[k] = v === 'true' ? true : v === 'false' ? false : v
  }

  return { settings, raw, updateSetting, loading }
}
