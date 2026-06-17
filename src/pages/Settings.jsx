import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Download, Copy, Check, ExternalLink, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDistanceToNow } from 'date-fns'

const selectClass = 'text-xs rounded px-2 py-1 border text-slate-300 outline-none focus:border-indigo-500'
const selectStyle = { background: '#1a1d27', borderColor: '#2a2d3a' }
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
  const { user, userCode } = useAuth()
  const { role, can } = usePermissions()
  const [appUsers, setAppUsers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)
  const [generatedInvite, setGeneratedInvite] = useState(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [confirmRevokeInvite, setConfirmRevokeInvite] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    if (!can.manageUsers) return
    supabase
      .from('users')
      .select('id, user_code, email, role, created_at')
      .order('user_code')
      .then(({ data }) => setAppUsers(data ?? []))
    supabase
      .from('invitations')
      .select('id, user_code, role, created_at')
      .eq('accepted', false)
      .order('created_at')
      .then(({ data }) => setPendingInvites(data ?? []))
  }, [can.manageUsers])

  const createInvite = async (e) => {
    e.preventDefault()
    setInviting(true); setGeneratedInvite(null)
    const token = crypto.randomUUID()
    const { data, error } = await supabase
      .from('invitations')
      .insert({ role: inviteRole, invited_by: user.id, token, accepted: false })
      .select('id, user_code, role, created_at')
      .single()
    setInviting(false)
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setGeneratedInvite({ user_code: data.user_code, token })
      setPendingInvites(p => [...p, data])
    }
  }

  const copyToken = async () => {
    await navigator.clipboard.writeText(generatedInvite.token)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const revokeUser = async (userId) => {
    await supabase.from('users').delete().eq('id', userId)
    setAppUsers(u => u.filter(x => x.id !== userId))
    setConfirmRevoke(null)
  }

  const revokeInvite = async (inviteId) => {
    await supabase.from('invitations').delete().eq('id', inviteId)
    setPendingInvites(p => p.filter(x => x.id !== inviteId))
    setConfirmRevokeInvite(null)
  }

  const changeRole = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setAppUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x))
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

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

      {/* User management — admin only */}
      {can.manageUsers && (
        <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <SectionTitle>User Management</SectionTitle>

          {/* Active users */}
          {appUsers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-600 mb-2 font-medium">Active · {appUsers.length}</p>
              <div className="flex flex-col gap-1.5">
                {appUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <RoleBadge role={u.role} />
                      <span className="text-xs text-slate-400 font-mono">#{u.user_code ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {can.inviteUsers && (
                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                          className={selectClass} style={selectStyle}>
                          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      )}
                      {u.id !== user.id && (
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
            </div>
          )}

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-600 mb-2 font-medium">Pending · {pendingInvites.length}</p>
              <div className="flex flex-col gap-1.5">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg opacity-70"
                    style={{ background: '#0f1117' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span style={{ background: 'rgba(148,163,184,0.1)', color: '#64748b', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        Pending
                      </span>
                      <span className="text-xs text-slate-500 font-mono">#{inv.user_code ?? '—'}</span>
                      <span className="text-xs text-slate-600 hidden sm:inline">
                        <RoleBadge role={inv.role} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-600 hidden sm:flex items-center gap-1">
                        <Clock size={10} />
                        {inv.created_at ? formatDistanceToNow(new Date(inv.created_at), { addSuffix: true }) : ''}
                      </span>
                      <button onClick={() => setConfirmRevokeInvite(inv)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Revoke invite">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {appUsers.length === 0 && pendingInvites.length === 0 && (
            <p className="text-xs text-slate-600 mb-4">No users yet.</p>
          )}

          {/* Invite form */}
          {can.inviteUsers && (
            <>
              <div className="border-t pt-4 mt-2" style={{ borderColor: '#2a2d3a' }}>
                <p className="text-xs text-slate-500 mb-2">
                  Select a role — the system will auto-assign an Access ID. Share both the ID and invite code with the new user.
                </p>
                <form onSubmit={createInvite} className="flex gap-2">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className={inputClass} style={inputStyle}>
                    <option value="viewer">Viewer</option>
                    <option value="support">Support</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" disabled={inviting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 disabled:opacity-50"
                    style={{ background: '#6366f1' }}>
                    <UserPlus size={15} />
                    {inviting ? 'Creating…' : 'Generate'}
                  </button>
                </form>
              </div>

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

      {/* Export — admin + lawyer */}
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

      {/* Profile link */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>My Account</SectionTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">ID: #{userCode ?? '—'}</span>
            <RoleBadge role={role} />
          </div>
          <Link to="/profile"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Manage <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Remove User"
        message={`Remove access for user #${confirmRevoke?.user_code ?? '—'}? They will no longer be able to sign in.`}
        confirmLabel="Remove"
        onConfirm={() => revokeUser(confirmRevoke?.id)}
        onCancel={() => setConfirmRevoke(null)}
      />
      <ConfirmDialog
        open={!!confirmRevokeInvite}
        title="Revoke Invitation"
        message={`Cancel the pending invite for #${confirmRevokeInvite?.user_code ?? '—'}? The invite code will no longer work.`}
        confirmLabel="Revoke"
        onConfirm={() => revokeInvite(confirmRevokeInvite?.id)}
        onCancel={() => setConfirmRevokeInvite(null)}
      />
    </div>
  )
}
