import { useEffect, useState } from 'react'
import { UserCheck, UserX, Trash2, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const selectClass = 'text-xs rounded px-2 py-1 border text-slate-300 outline-none focus:border-indigo-500'
const selectStyle = { background: '#1a1d27', borderColor: '#2a2d3a' }

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

export default function Admin() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const isAdmin = can.manageUsers
  const isReadOnly = can.viewAdmin && !can.manageUsers

  const [appUsers, setAppUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingRoles, setPendingRoles] = useState({})
  const [confirmRevoke, setConfirmRevoke] = useState(null)

  useEffect(() => {
    supabase.from('users').select('id, user_code, email, role, created_at').eq('status', 'active').order('user_code')
      .then(({ data }) => setAppUsers(data ?? []))
    supabase.from('users').select('id, user_code, role, created_at').eq('status', 'pending').order('created_at')
      .then(({ data }) => {
        setPendingUsers(data ?? [])
        const roles = {}
        ;(data ?? []).forEach(u => { roles[u.id] = 'viewer' })
        setPendingRoles(roles)
      })
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
    await supabase.from('users').delete().eq('id', userId)
    setAppUsers(u => u.filter(x => x.id !== userId))
    setConfirmRevoke(null)
  }

  const changeRole = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setAppUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x))
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">Admin Panel</h1>
        {isReadOnly && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1.5 rounded-lg">
            <Eye size={12} /> View only
          </div>
        )}
      </div>

      {/* Pending Users */}
      {(pendingUsers.length > 0 || isAdmin) && (
        <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <SectionTitle>Pending Approval · {pendingUsers.length}</SectionTitle>
          {pendingUsers.length === 0 ? (
            <p className="text-xs text-slate-600">No pending registrations.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg"
                  style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                      Pending
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                  </div>
                  {isAdmin && (
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
            </div>
          )}
        </div>
      )}

      {/* Active Users */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Active Users · {appUsers.length}</SectionTitle>
        {appUsers.length === 0 ? (
          <p className="text-xs text-slate-600">No active users.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {appUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <RoleBadge role={u.role} />
                  <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                  {u.id === user?.id && <span className="text-[10px] text-slate-600">(you)</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isAdmin && (
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      className={selectClass} style={selectStyle}>
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
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
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Remove User"
        message={`Remove access for user #${confirmRevoke?.user_code ?? '—'}? They will no longer be able to sign in.`}
        confirmLabel="Remove"
        onConfirm={() => revokeUser(confirmRevoke?.id)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  )
}
