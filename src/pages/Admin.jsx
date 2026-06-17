import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Copy, Check, Clock, Eye } from 'lucide-react'
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

export default function Admin() {
  const { user } = useAuth()
  const { role, can } = usePermissions()
  const isAdmin = can.manageUsers
  const isReadOnly = can.viewAdmin && !can.manageUsers

  const [appUsers, setAppUsers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)
  const [generatedInvite, setGeneratedInvite] = useState(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [confirmRevokeInvite, setConfirmRevokeInvite] = useState(null)

  useEffect(() => {
    supabase.from('users').select('id, user_code, email, role, created_at').order('user_code')
      .then(({ data }) => setAppUsers(data ?? []))
    supabase.from('invitations').select('id, user_code, role, created_at').eq('accepted', false).order('created_at')
      .then(({ data }) => setPendingInvites(data ?? []))
  }, [])

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
    if (error) alert(`Error: ${error.message}`)
    else {
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

      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Active Users · {appUsers.length}</SectionTitle>

        {appUsers.length === 0 ? (
          <p className="text-xs text-slate-600 mb-4">No users yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5 mb-4">
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

        {/* Pending invitations */}
        {(pendingInvites.length > 0 || isAdmin) && (
          <>
            <SectionTitle>Pending Invitations · {pendingInvites.length}</SectionTitle>
            {pendingInvites.length === 0 ? (
              <p className="text-xs text-slate-600 mb-4">No pending invitations.</p>
            ) : (
              <div className="flex flex-col gap-1.5 mb-4">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg opacity-70"
                    style={{ background: '#0f1117' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span style={{ background: 'rgba(148,163,184,0.1)', color: '#64748b', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                        Pending
                      </span>
                      <span className="text-xs text-slate-500 font-mono">#{inv.user_code ?? '—'}</span>
                      <RoleBadge role={inv.role} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-600 hidden sm:flex items-center gap-1">
                        <Clock size={10} />
                        {inv.created_at ? formatDistanceToNow(new Date(inv.created_at), { addSuffix: true }) : ''}
                      </span>
                      {isAdmin && (
                        <button onClick={() => setConfirmRevokeInvite(inv)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Revoke invite">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Invite form — admin only */}
        {isAdmin && (
          <div className="border-t pt-4 mt-2" style={{ borderColor: '#2a2d3a' }}>
            <p className="text-xs text-slate-500 mb-2">
              Select a role — the system auto-assigns an Access ID. Share the ID and invite code with the new user.
            </p>
            <form onSubmit={createInvite} className="flex gap-2">
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className={inputClass} style={inputStyle}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
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
