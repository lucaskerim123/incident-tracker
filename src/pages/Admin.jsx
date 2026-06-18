import { useEffect, useState } from 'react'
import { UserCheck, UserX, Trash2, Eye, X, AlertTriangle, Plus, Pencil, Check, Lock, ChevronDown, Search, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const selectClass = 'text-xs rounded px-2 py-1 border text-slate-300 outline-none focus:border-indigo-500'
const selectStyle = { background: '#1a1d27', borderColor: '#2a2d3a' }
const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

function SectionTitle({ children }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{children}</h2>
}

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.viewer
  return (
    <span style={{ background: s.bg, color: s.text, padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function TypeBadge({ type }) {
  if (type === 'registration') {
    return (
      <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
        Registration
      </span>
    )
  }
  if (type === 'pwreset') {
    return (
      <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
        Pwd Reset
      </span>
    )
  }
  return (
    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
      Deletion Req
    </span>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const { can, isAdmin } = usePermissions()
  const canManage = can.manageUsers

  const [appUsers, setAppUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [deletionRequests, setDeletionRequests] = useState([])
  const [pwResetRequests, setPwResetRequests] = useState([])
  const [pendingRoles, setPendingRoles] = useState({})

  // Create user
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ password: '', role: 'viewer', displayName: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createMsg, setCreateMsg] = useState({ text: '', ok: false })

  // Inline edit
  const [expandedUser, setExpandedUser] = useState(null)
  const [editForm, setEditForm] = useState({ displayName: '', role: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState({})

  // Password reset
  const [pwInput, setPwInput] = useState({})
  const [pwMsg, setPwMsg] = useState({})
  const [pwLoading, setPwLoading] = useState({})

  // Search / filter
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Confirm revoke
  const [confirmRevoke, setConfirmRevoke] = useState(null)

  useEffect(() => {
    supabase.from('users').select('id, user_code, display_name, email, role, created_at').eq('status', 'active').order('user_code')
      .then(({ data }) => setAppUsers(data ?? []))
    supabase.from('users').select('id, user_code, created_at').eq('status', 'pending').order('created_at')
      .then(({ data }) => {
        setPendingUsers(data ?? [])
        const roles = {}
        ;(data ?? []).forEach(u => { roles[u.id] = 'viewer' })
        setPendingRoles(roles)
      })
    supabase.from('users')
      .select('id, user_code, role, deletion_requested_at')
      .eq('status', 'active')
      .not('deletion_requested_at', 'is', null)
      .order('deletion_requested_at')
      .then(({ data }) => setDeletionRequests(data ?? []))
    supabase.from('users')
      .select('id, user_code, role, password_reset_requested_at')
      .eq('status', 'active')
      .not('password_reset_requested_at', 'is', null)
      .order('password_reset_requested_at')
      .then(({ data }) => setPwResetRequests(data ?? []))
  }, [])

  const approveUser = async (userId) => {
    const role = pendingRoles[userId] ?? 'viewer'
    await supabase.from('users').update({ status: 'active', role }).eq('id', userId)
    const approved = pendingUsers.find(u => u.id === userId)
    if (approved) setAppUsers(a => [...a, { ...approved, role, status: 'active' }].sort((a, b) => a.user_code - b.user_code))
    setPendingUsers(p => p.filter(u => u.id !== userId))
  }

  const rejectUser = async (userId) => {
    await supabase.from('users').delete().eq('id', userId)
    setPendingUsers(p => p.filter(u => u.id !== userId))
  }

  const revokeUser = async (userId) => {
    await supabase.rpc('delete_user', { target_id: userId })
    setAppUsers(u => u.filter(x => x.id !== userId))
    setConfirmRevoke(null)
  }

  const approveDeletion = async (userId) => {
    await supabase.rpc('delete_user', { target_id: userId })
    setDeletionRequests(d => d.filter(x => x.id !== userId))
    setAppUsers(u => u.filter(x => x.id !== userId))
  }

  const rejectDeletion = async (userId) => {
    await supabase.from('users').update({ deletion_requested_at: null }).eq('id', userId)
    setDeletionRequests(d => d.filter(x => x.id !== userId))
  }

  const resolvePwReset = async (userId) => {
    const pw = pwInput[userId] ?? ''
    if (!pw || pw.length < 6) {
      setPwMsg(m => ({ ...m, [userId]: { text: 'Min 6 characters.', ok: false } }))
      return
    }
    setPwLoading(l => ({ ...l, [userId]: true }))
    setPwMsg(m => ({ ...m, [userId]: { text: '', ok: false } }))
    const { error } = await supabase.rpc('admin_reset_password', { target_id: userId, new_password: pw })
    setPwLoading(l => ({ ...l, [userId]: false }))
    if (error) {
      setPwMsg(m => ({ ...m, [userId]: { text: 'Reset failed.', ok: false } }))
    } else {
      setPwResetRequests(r => r.filter(x => x.id !== userId))
      setPwInput(p => ({ ...p, [userId]: '' }))
      setPwMsg(m => ({ ...m, [userId]: { text: '', ok: false } }))
    }
  }

  const dismissPwReset = async (userId) => {
    await supabase.from('users').update({ password_reset_requested_at: null }).eq('id', userId)
    setPwResetRequests(r => r.filter(x => x.id !== userId))
  }

  const createUser = async (e) => {
    e.preventDefault()
    if (!createForm.password) return
    setCreateLoading(true)
    setCreateMsg({ text: '', ok: false })
    const { data, error } = await supabase.rpc('admin_create_user', {
      in_password: createForm.password,
      in_role: createForm.role,
      in_display_name: createForm.displayName.trim() || null,
    })
    setCreateLoading(false)
    if (error) {
      setCreateMsg({ text: `Error: ${error.message}`, ok: false })
      return
    }
    const newCode = data?.user_code
    const newId = data?.id
    setAppUsers(a => [{
      id: newId,
      user_code: newCode,
      display_name: createForm.displayName.trim() || null,
      email: `${newCode}@it.local`,
      role: createForm.role,
      created_at: new Date().toISOString(),
    }, ...a].sort((a, b) => a.user_code - b.user_code))
    setCreateMsg({ text: `User #${newCode} created successfully.`, ok: true })
    setCreateForm({ password: '', role: 'viewer', displayName: '' })
    setTimeout(() => setCreateMsg({ text: '', ok: false }), 5000)
  }

  const openEdit = (u) => {
    setExpandedUser(u.id)
    setEditForm({ displayName: u.display_name ?? '', role: u.role })
    setEditMsg({})
  }

  const cancelEdit = () => {
    setExpandedUser(null)
    setEditMsg({})
  }

  const saveUserEdit = async (userId) => {
    setEditLoading(true)
    const { error } = await supabase.from('users')
      .update({ display_name: editForm.displayName.trim() || null, role: editForm.role })
      .eq('id', userId)
    setEditLoading(false)
    if (error) {
      setEditMsg(m => ({ ...m, [userId]: { text: 'Save failed.', ok: false } }))
      return
    }
    setAppUsers(u => u.map(x => x.id === userId ? { ...x, display_name: editForm.displayName.trim() || null, role: editForm.role } : x))
    setExpandedUser(null)
  }

  const resetPassword = async (userId) => {
    const pw = pwInput[userId] ?? ''
    if (!pw || pw.length < 6) {
      setPwMsg(m => ({ ...m, [userId]: { text: 'Min 6 characters.', ok: false } }))
      return
    }
    setPwLoading(l => ({ ...l, [userId]: true }))
    setPwMsg(m => ({ ...m, [userId]: { text: '', ok: false } }))
    const { error } = await supabase.rpc('admin_reset_password', { target_id: userId, new_password: pw })
    setPwLoading(l => ({ ...l, [userId]: false }))
    if (error) {
      setPwMsg(m => ({ ...m, [userId]: { text: 'Reset failed.', ok: false } }))
    } else {
      setPwMsg(m => ({ ...m, [userId]: { text: 'Password updated.', ok: true } }))
      setPwInput(p => ({ ...p, [userId]: '' }))
      setTimeout(() => setPwMsg(m => ({ ...m, [userId]: { text: '', ok: false } })), 4000)
    }
  }

  const pendingCount = pendingUsers.length + deletionRequests.length + pwResetRequests.length

  const filtered = appUsers
    .filter(u => roleFilter ? u.role === roleFilter : true)
    .filter(u => search
      ? String(u.user_code).includes(search) ||
        (u.display_name ?? '').toLowerCase().includes(search.toLowerCase())
      : true
    )

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Admin Panel</h1>
        {can.viewAdmin && !canManage && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1.5 rounded-lg">
            <Eye size={12} /> View only
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'Active', val: appUsers.length, color: '#34d399' },
          { label: 'Pending', val: pendingCount, color: pendingCount > 0 ? '#eab308' : '#475569' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: s.color }}>
            <span style={{ color: s.color }}>{s.val}</span>
            <span className="text-slate-500 font-normal">{s.label}</span>
          </div>
        ))}
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = appUsers.filter(u => u.role === role).length
          if (!count) return null
          const s = ROLE_STYLES[role]
          return (
            <div key={role} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
              <span style={{ color: s.text }} className="font-semibold">{count}</span>
              <span className="text-slate-500">{label}</span>
            </div>
          )
        })}
      </div>

      {/* Pending Actions */}
      {(pendingCount > 0 || canManage) && (
        <div className="rounded-xl p-4 border mb-4"
          style={{ background: '#1a1d27', borderColor: pendingCount > 0 ? 'rgba(239,68,68,0.25)' : '#2a2d3a' }}>
          <div className="flex items-center gap-2 mb-3">
            {pendingCount > 0 && <AlertTriangle size={13} className="text-red-400" />}
            <SectionTitle>
              <span className={pendingCount > 0 ? 'text-red-400' : ''}>
                Pending Actions · {pendingCount}
              </span>
            </SectionTitle>
          </div>

          {pendingCount === 0 ? (
            <p className="text-xs text-slate-600">No pending actions.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Registration requests */}
              {pendingUsers.map(u => (
                <div key={`reg-${u.id}`} className="flex items-center justify-between gap-2 p-2.5 rounded-lg"
                  style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <TypeBadge type="registration" />
                    <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                    <span className="text-xs text-slate-600">
                      {u.created_at && format(new Date(u.created_at), 'd MMM yyyy')}
                    </span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={pendingRoles[u.id] ?? 'viewer'}
                        onChange={e => setPendingRoles(r => ({ ...r, [u.id]: e.target.value }))}
                        className={selectClass} style={selectStyle}>
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button onClick={() => approveUser(u.id)}
                        className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                        title="Approve user">
                        <UserCheck size={14} />
                      </button>
                      <button onClick={() => rejectUser(u.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Reject user">
                        <UserX size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Deletion requests */}
              {deletionRequests.map(u => (
                <div key={`del-${u.id}`} className="flex items-center justify-between gap-2 p-2.5 rounded-lg"
                  style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <TypeBadge type="deletion" />
                    <RoleBadge role={u.role} />
                    <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                    <span className="text-xs text-slate-600">
                      {u.deletion_requested_at && format(new Date(u.deletion_requested_at), 'd MMM yyyy')}
                    </span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => rejectDeletion(u.id)}
                        className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded transition-colors"
                        title="Reject — keep account">
                        <X size={14} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => approveDeletion(u.id)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Approve — delete account">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Password reset requests */}
              {pwResetRequests.map(u => (
                <div key={`pwr-${u.id}`} className="rounded-lg overflow-hidden" style={{ background: '#0f1117' }}>
                  <div className="flex items-center justify-between gap-2 p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <TypeBadge type="pwreset" />
                      <RoleBadge role={u.role} />
                      <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                      <span className="text-xs text-slate-600">
                        {u.password_reset_requested_at && format(new Date(u.password_reset_requested_at), 'd MMM yyyy')}
                      </span>
                    </div>
                    {canManage && (
                      <button onClick={() => dismissPwReset(u.id)}
                        className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded transition-colors"
                        title="Dismiss">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {canManage && (
                    <div className="px-2.5 pb-2.5 flex gap-2 items-start">
                      <div className="relative flex-1">
                        <KeyRound size={12} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                        <input
                          type="password"
                          value={pwInput[u.id] ?? ''}
                          onChange={e => setPwInput(p => ({ ...p, [u.id]: e.target.value }))}
                          placeholder="Set new password (min 6)"
                          className="w-full rounded-lg pl-8 pr-3 py-2 text-xs text-slate-300 border outline-none focus:border-indigo-500 transition-colors"
                          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
                      </div>
                      <button
                        onClick={() => resolvePwReset(u.id)}
                        disabled={pwLoading[u.id]}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                        style={{ background: '#6366f1' }}>
                        {pwLoading[u.id] ? '…' : 'Set & Resolve'}
                      </button>
                    </div>
                  )}
                  {pwMsg[u.id]?.text && (
                    <p className={`text-xs px-2.5 pb-2 ${pwMsg[u.id].ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg[u.id].text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create User */}
      {canManage && (
        <div className="rounded-xl border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <button
            onClick={() => { setCreating(c => !c); setCreateMsg({ text: '', ok: false }) }}
            className="w-full flex items-center justify-between px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <Plus size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Create User</span>
            </div>
            <ChevronDown size={14} className={`text-slate-600 transition-transform ${creating ? 'rotate-180' : ''}`} />
          </button>

          {creating && (
            <form onSubmit={createUser} className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: '#2a2d3a' }}>
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1 block">Display name <span className="text-slate-600">(optional)</span></label>
                  <input
                    value={createForm.displayName}
                    onChange={e => setCreateForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="e.g. John Smith"
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 chars"
                      className={`${inputClass} pl-8`} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Role</label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                    className={`${inputClass} text-xs`} style={inputStyle}>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {createMsg.text && (
                <p className={`text-xs ${createMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{createMsg.text}</p>
              )}
              <div className="flex items-center gap-2">
                <button type="submit" disabled={createLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: '#6366f1' }}>
                  {createLoading ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" onClick={() => { setCreating(false); setCreateMsg({ text: '', ok: false }) }}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Active Users */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Active Users · {appUsers.length}</SectionTitle>
        </div>

        {/* Search + role filter */}
        {appUsers.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by code or name…"
                className="w-full rounded-lg pl-8 pr-3 py-2 text-xs text-slate-300 border outline-none focus:border-indigo-500 transition-colors"
                style={{ background: '#0f1117', borderColor: '#2a2d3a' }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['', ...Object.keys(ROLE_LABELS)].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    roleFilter === r
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={roleFilter === r
                    ? { background: r ? ROLE_STYLES[r]?.bg : 'rgba(99,102,241,0.15)', color: r ? ROLE_STYLES[r]?.text : '#818cf8' }
                    : { background: '#0f1117' }
                  }>
                  {r ? ROLE_LABELS[r] : 'All'}
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-xs text-slate-600">{appUsers.length === 0 ? 'No active users.' : 'No users match your filters.'}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map(u => (
              <div key={u.id} className="rounded-lg overflow-hidden" style={{ background: '#0f1117' }}>
                {/* Collapsed row */}
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <RoleBadge role={u.role} />
                    <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                    {u.display_name
                      ? <span className="text-xs text-slate-300 truncate">{u.display_name}</span>
                      : <span className="text-xs text-slate-600 italic">No name</span>
                    }
                    {u.id === user?.id && <span className="text-[10px] text-slate-600">(you)</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canManage && (
                      <button
                        onClick={() => expandedUser === u.id ? cancelEdit() : openEdit(u)}
                        className={`p-1.5 rounded transition-colors ${
                          expandedUser === u.id
                            ? 'text-indigo-400 bg-indigo-500/10'
                            : 'text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10'
                        }`}
                        title="Edit user">
                        <Pencil size={13} />
                      </button>
                    )}
                    {isAdmin && u.id !== user?.id && (
                      <button onClick={() => setConfirmRevoke(u)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove user">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded edit form */}
                {expandedUser === u.id && (
                  <div className="px-3 pb-3 border-t flex flex-col gap-3" style={{ borderColor: '#2a2d3a' }}>
                    <div className="pt-3 grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500 mb-1 block">Display name</label>
                        <input
                          value={editForm.displayName}
                          onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                          placeholder="No name set"
                          className={inputClass} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Role</label>
                        <select
                          value={editForm.role}
                          onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                          className={`${inputClass} text-xs`} style={inputStyle}
                          disabled={!isAdmin && u.id === user?.id}>
                          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex gap-2">
                          <button onClick={() => saveUserEdit(u.id)} disabled={editLoading}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1"
                            style={{ background: '#6366f1' }}>
                            <Check size={12} />
                            {editLoading ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={cancelEdit}
                            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                    {editMsg[u.id]?.text && (
                      <p className={`text-xs ${editMsg[u.id].ok ? 'text-emerald-400' : 'text-red-400'}`}>{editMsg[u.id].text}</p>
                    )}

                    {/* Password reset */}
                    <div className="pt-2 border-t" style={{ borderColor: '#2a2d3a' }}>
                      <label className="text-xs text-slate-500 mb-1.5 block">Reset password</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Lock size={13} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                          <input
                            type="password"
                            value={pwInput[u.id] ?? ''}
                            onChange={e => setPwInput(p => ({ ...p, [u.id]: e.target.value }))}
                            placeholder="New password (min 6)"
                            className={`${inputClass} pl-8`} style={inputStyle} />
                        </div>
                        <button
                          onClick={() => resetPassword(u.id)}
                          disabled={pwLoading[u.id]}
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                          style={{ background: '#374151' }}>
                          {pwLoading[u.id] ? '…' : 'Reset'}
                        </button>
                      </div>
                      {pwMsg[u.id]?.text && (
                        <p className={`text-xs mt-1.5 ${pwMsg[u.id].ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg[u.id].text}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Remove User"
        message={`Remove access for user #${confirmRevoke?.user_code ?? '—'}? This permanently deletes their account.`}
        confirmLabel="Remove"
        onConfirm={() => revokeUser(confirmRevoke?.id)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  )
}
