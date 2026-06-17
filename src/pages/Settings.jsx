import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Download, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
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

export default function Settings() {
  const { user, userCode, updatePasscode } = useAuth()
  const { role, can } = usePermissions()
  const [users, setUsers] = useState([])
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)
  const [generatedInvite, setGeneratedInvite] = useState(null) // { user_code, token }
  const [tokenCopied, setTokenCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [newPasscode, setNewPasscode] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    if (!can.manageUsers) return
    supabase.from('user_roles').select('user_id, role, user_code, created_at').order('created_at')
      .then(({ data }) => setUsers(data ?? []))
  }, [can.manageUsers])

  const createInvite = async (e) => {
    e.preventDefault()
    setInviting(true); setGeneratedInvite(null)
    const token = crypto.randomUUID()
    const { data, error } = await supabase.from('invitations').insert({
      role: inviteRole,
      invited_by: user.id,
      token,
      accepted: false,
    }).select('user_code').single()
    setInviting(false)
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setGeneratedInvite({ user_code: data.user_code, token })
    }
  }

  const copyToken = async () => {
    await navigator.clipboard.writeText(generatedInvite.token)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const revokeUser = async (userId) => {
    await supabase.from('user_roles').delete().eq('user_id', userId)
    setUsers(u => u.filter(x => x.user_id !== userId))
    setConfirmRevoke(null)
  }

  const changeRole = async (userId, newRole) => {
    await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId)
    setUsers(u => u.map(x => x.user_id === userId ? { ...x, role: newRole } : x))
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

  const handleUpdatePasscode = async (e) => {
    e.preventDefault()
    const { error } = await updatePasscode(newPasscode)
    if (error) setPwMsg(`Error: ${error.message}`)
    else { setPwMsg('Passcode updated.'); setNewPasscode('') }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

      {/* User management — editor+ */}
      {can.manageUsers && (
        <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <SectionTitle>User Management</SectionTitle>

          {users.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {users.map(u => (
                <div key={u.user_id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <RoleBadge role={u.role} />
                    <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {can.inviteUsers && (
                      <select value={u.role} onChange={e => changeRole(u.user_id, e.target.value)}
                        className="text-xs rounded px-2 py-1 border text-slate-300 outline-none focus:border-indigo-500"
                        style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    )}
                    {u.user_id !== user.id && (
                      <button onClick={() => setConfirmRevoke(u)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invite form — admin only */}
          {can.inviteUsers && (
            <>
              <form onSubmit={createInvite} className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 mb-1">Select a role — the system will auto-assign an Access ID. Share both the ID and the invite code with the new user.</p>
                <div className="flex gap-2">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className={inputClass} style={inputStyle}>
                    <option value="viewer">Viewer</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" disabled={inviting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 disabled:opacity-50"
                    style={{ background: '#6366f1' }}>
                    <UserPlus size={15} />
                    {inviting ? 'Creating…' : 'Generate'}
                  </button>
                </div>
              </form>

              {generatedInvite && (
                <div className="mt-3 p-3 rounded-lg border" style={{ background: '#0f1117', borderColor: '#34d399' }}>
                  <p className="text-xs text-emerald-400 font-semibold mb-2">Invite created — share these with the new user (shown once):</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-20 shrink-0">Access ID</span>
                      <code className="text-xs text-slate-100 font-mono font-bold">#{generatedInvite.user_code}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-20 shrink-0">Invite code</span>
                      <code className="text-xs text-slate-300 flex-1 break-all font-mono">{generatedInvite.token}</code>
                      <button type="button" onClick={copyToken}
                        className="shrink-0 p-1.5 rounded text-slate-400 hover:text-slate-200 transition-colors">
                        {tokenCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Export — editor+ */}
      {can.export && (
        <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <SectionTitle>Export Data</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportIncidents} disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-200 border hover:border-indigo-500/50 transition-colors disabled:opacity-50"
              style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
              <Download size={15} className="text-indigo-400" /> Export JSON
            </button>
            <button onClick={exportCsv} disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-200 border hover:border-indigo-500/50 transition-colors disabled:opacity-50"
              style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
              <Download size={15} className="text-indigo-400" /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Change passcode — everyone */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Change Passcode</SectionTitle>
        <form onSubmit={handleUpdatePasscode} className="flex flex-col gap-2">
          <input type="password" placeholder="New passcode (min 6 chars)" minLength={6}
            value={newPasscode} onChange={e => setNewPasscode(e.target.value)}
            className={inputClass} style={inputStyle} />
          {pwMsg && <p className={`text-xs ${pwMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{pwMsg}</p>}
          <button type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white w-fit"
            style={{ background: '#6366f1' }}>
            Update Passcode
          </button>
        </form>
        <div className="flex items-center gap-2 mt-3">
          <p className="text-xs text-slate-600">ID: {userCode ?? '—'}</p>
          <RoleBadge role={role} />
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke Access"
        message={`Remove access for user #${confirmRevoke?.user_code ?? '—'}? They will no longer be able to sign in.`}
        confirmLabel="Revoke"
        onConfirm={() => revokeUser(confirmRevoke?.user_id)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  )
}
