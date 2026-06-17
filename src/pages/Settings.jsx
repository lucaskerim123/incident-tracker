import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { UserPlus, Trash2, Shield, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

const ROLE_STYLES = {
  admin:    { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  lawyer:   { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  support:  { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  readonly: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

const ROLE_LABELS = { admin: 'Admin', lawyer: 'Lawyer', support: 'Support', readonly: 'Read Only' }

function SectionTitle({ children }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{children}</h2>
}

export default function Settings() {
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  const [users, setUsers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('support')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('user_roles').select('*').order('created_at')
      .then(({ data }) => setUsers(data ?? []))
  }, [isAdmin])

  const inviteUser = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg('')
    const { error } = await supabase.auth.admin ?
      supabase.from('invitations').insert({ email: inviteEmail, role: inviteRole, invited_by: user.id, accepted: false, token: crypto.randomUUID() }) :
      supabase.from('invitations').insert({ email: inviteEmail, role: inviteRole, invited_by: user.id, accepted: false, token: crypto.randomUUID() })
    setInviting(false)
    if (error) setInviteMsg(`Error: ${error.message}`)
    else { setInviteMsg(`Invitation recorded for ${inviteEmail}. Share the app URL with them.`); setInviteEmail('') }
  }

  const revokeUser = async (userId) => {
    await supabase.from('user_roles').delete().eq('user_id', userId)
    setUsers(u => u.filter(x => x.user_id !== userId))
    setConfirmRevoke(null)
  }

  const changeRole = async (userId, role) => {
    await supabase.from('user_roles').update({ role }).eq('user_id', userId)
    setUsers(u => u.map(x => x.user_id === userId ? { ...x, role } : x))
  }

  const exportIncidents = async () => {
    setExportLoading(true)
    const { data } = await supabase.from('incidents').select('*').order('date')
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `incidents_${new Date().toISOString().slice(0,10)}.json`
      a.click(); URL.revokeObjectURL(url)
    }
    setExportLoading(false)
  }

  const exportCsv = async () => {
    setExportLoading(true)
    const { data } = await supabase.from('incidents').select('date,title,category,status,reference_number,outcome,description').order('date')
    if (data && data.length) {
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `incidents_${new Date().toISOString().slice(0,10)}.csv`
      a.click(); URL.revokeObjectURL(url)
    }
    setExportLoading(false)
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwMsg(`Error: ${error.message}`)
    else { setPwMsg('Password updated.'); setNewPassword('') }
  }

  if (!isAdmin) return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-4">Settings</h1>
      <div className="rounded-xl p-6 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <Shield size={32} className="text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Settings are restricted to admins only.</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

      {/* User management */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>User Management</SectionTitle>

        {/* Current users */}
        {users.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {users.map(u => {
              const s = ROLE_STYLES[u.role] ?? ROLE_STYLES.readonly
              return (
                <div key={u.user_id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ ...s, padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select value={u.role} onChange={e => changeRole(u.user_id, e.target.value)}
                      className="text-xs rounded px-2 py-1 border text-slate-300 outline-none focus:border-indigo-500"
                      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    {u.user_id !== user.id && (
                      <button onClick={() => setConfirmRevoke(u)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Invite form */}
        <form onSubmit={inviteUser} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input type="email" placeholder="Email address to invite"
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className={`${inputClass} flex-1`} style={inputStyle} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className={inputClass} style={{ ...inputStyle, width: 110 }}>
              <option value="lawyer">Lawyer</option>
              <option value="support">Support</option>
              <option value="readonly">Read Only</option>
            </select>
          </div>
          {inviteMsg && <p className={`text-xs ${inviteMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{inviteMsg}</p>}
          <button type="submit" disabled={inviting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white w-fit disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            <UserPlus size={15} />
            {inviting ? 'Recording…' : 'Invite User'}
          </button>
        </form>
      </div>

      {/* Export */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Export Data</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportIncidents} disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-200 border hover:border-indigo-500/50 transition-colors"
            style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
            <Download size={15} className="text-indigo-400" /> Export JSON
          </button>
          <button onClick={exportCsv} disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-200 border hover:border-indigo-500/50 transition-colors"
            style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
            <Download size={15} className="text-indigo-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Change Password</SectionTitle>
        <form onSubmit={updatePassword} className="flex flex-col gap-2">
          <input type="password" placeholder="New password (min 8 chars)" minLength={8}
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
            className={inputClass} style={inputStyle} />
          {pwMsg && <p className={`text-xs ${pwMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{pwMsg}</p>}
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white w-fit"
            style={{ background: '#6366f1' }}>
            Update Password
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-3">Signed in as {user?.email}</p>
      </div>

      <ConfirmDialog open={!!confirmRevoke} title="Revoke Access"
        message={`Remove access for ${confirmRevoke?.email}? They will no longer be able to sign in.`}
        confirmLabel="Revoke" onConfirm={() => revokeUser(confirmRevoke?.user_id)} onCancel={() => setConfirmRevoke(null)} />
    </div>
  )
}
