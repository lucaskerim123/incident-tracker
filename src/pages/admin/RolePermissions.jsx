import { useState } from 'react'
import { ShieldOff, RotateCcw, Info } from 'lucide-react'
import { usePermissions, PERMISSION_DEFS, ROLE_LABELS, ROLE_STYLES, DEFAULT_PERMISSIONS } from '../../hooks/usePermissions'
import { useRolePermissionsContext } from '../../context/RolePermissionsContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import { supabase } from '../../lib/supabase'

// Roles that can be edited (admin is always full-access, never editable)
const EDITABLE_ROLES = ['editor', 'lawyer', 'viewer']

// Group the permission defs for rendering sections
function groupDefs() {
  const groups = {}
  for (const [key, def] of Object.entries(PERMISSION_DEFS)) {
    if (!groups[def.group]) groups[def.group] = []
    groups[def.group].push({ key, ...def })
  }
  return groups
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus:outline-none disabled:opacity-40 ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}
      role="switch"
      aria-checked={checked}>
      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform duration-150 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function RolePermissions() {
  const { isAdmin } = usePermissions()
  const ctx = useRolePermissionsContext()
  const [selectedRole, setSelectedRole] = useState('editor')
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  if (!isAdmin) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-20">
      <ShieldOff size={32} className="text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-500">Only admins can manage role permissions.</p>
    </div>
  )

  const groups = groupDefs()
  const currentPerms = ctx?.getPermissions(selectedRole) ?? DEFAULT_PERMISSIONS[selectedRole]
  const defaults = DEFAULT_PERMISSIONS[selectedRole]
  const overrides = ctx?.overrides?.[selectedRole] ?? {}

  const isOverridden = (key) => key in overrides && overrides[key] !== defaults[key]

  const handleToggle = (key) => {
    const current = currentPerms[key] ?? false
    ctx?.setPermission(selectedRole, key, !current)
  }

  const resetRole = async () => {
    setResetting(true)
    await supabase.from('role_permissions').delete().eq('role', selectedRole)
    setResetting(false)
    setConfirmReset(false)
  }

  const rs = ROLE_STYLES[selectedRole]

  return (
    <div className="p-4 max-w-2xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-slate-100">Role Permissions</h1>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Customise what each role can see and do. Admin permissions are always full-access and cannot be changed.
      </p>

      {/* Role selector */}
      <div className="flex gap-1.5 mb-5 p-1 rounded-xl" style={{ background: '#1a1d27' }}>
        {EDITABLE_ROLES.map(r => {
          const s = ROLE_STYLES[r]
          const active = selectedRole === r
          return (
            <button key={r} onClick={() => setSelectedRole(r)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={active
                ? { background: s.bg, color: s.text, outline: `1.5px solid ${s.text}33` }
                : { color: '#64748b' }
              }>
              {ROLE_LABELS[r]}
            </button>
          )
        })}
      </div>

      {/* Override count + reset */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: rs.bg, color: rs.text }}>
            {ROLE_LABELS[selectedRole]}
          </span>
          {Object.keys(overrides).length > 0 && (
            <span className="text-xs text-amber-400">
              {Object.keys(overrides).length} override{Object.keys(overrides).length !== 1 ? 's' : ''} from default
            </span>
          )}
        </div>
        {Object.keys(overrides).length > 0 && (
          <button onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border transition-colors"
            style={{ borderColor: '#2a2d3a', background: '#1a1d27' }}>
            <RotateCcw size={11} /> Reset to defaults
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg mb-5 border"
        style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <Info size={13} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Changes take effect immediately for all users with this role. New permissions added by developers
          automatically appear here with their default value.
        </p>
      </div>

      {/* Permission groups */}
      <div className="flex flex-col gap-3">
        {Object.entries(groups).map(([group, defs]) => (
          <div key={group} className="rounded-xl border overflow-hidden" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
            <div className="px-4 py-2.5 border-b" style={{ borderColor: '#2a2d3a', background: '#0f1117' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{group}</p>
            </div>
            <div className="divide-y" style={{ borderColor: '#2a2d3a' }}>
              {defs.map(({ key, label }) => {
                const enabled = currentPerms[key] ?? false
                const changed = isOverridden(key)
                return (
                  <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm text-slate-200">{label}</p>
                      {changed && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
                          modified
                        </span>
                      )}
                    </div>
                    <Toggle
                      checked={enabled}
                      onChange={() => handleToggle(key)}
                      disabled={!ctx}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={`Reset ${ROLE_LABELS[selectedRole]} to defaults`}
        message={`This will remove all custom overrides for the ${ROLE_LABELS[selectedRole]} role and restore the original default permissions.`}
        confirmLabel={resetting ? 'Resetting…' : 'Reset'}
        onConfirm={resetRole}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
