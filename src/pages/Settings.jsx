import { useEffect, useState } from 'react'
import { Lock, Eye, EyeOff, Pencil, Check, X, LogOut, AlertTriangle, Clock, HelpCircle, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import { useAppSettings } from '../hooks/useAppSettings'

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
  const { role } = usePermissions()
  const { settings: appSettings } = useAppSettings()

  // Profile
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [joinedAt, setJoinedAt] = useState(null)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false })

  // Sign out all sessions
  const [signingOutAll, setSigningOutAll] = useState(false)
  const [signOutMsg, setSignOutMsg] = useState('')
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  // Danger zone
  const [deletionRequestedAt, setDeletionRequestedAt] = useState(null)
  const [deletionLoading, setDeletionLoading] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('users').select('display_name, created_at, deletion_requested_at').eq('id', user.id).single()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? '')
        setNameInput(data?.display_name ?? '')
        setJoinedAt(data?.created_at ?? null)
        setDeletionRequestedAt(data?.deletion_requested_at ?? null)
      })
  }, [user])

  const saveDisplayName = async () => {
    setNameSaving(true)
    await supabase.from('users').update({ display_name: nameInput.trim() || null }).eq('id', user.id)
    setDisplayName(nameInput.trim())
    setNameSaving(false)
    setEditingName(false)
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPwMsg({ text: 'Passwords do not match.', ok: false }); return }
    setPwLoading(true); setPwMsg({ text: '', ok: false })
    const { error } = await updatePasscode(newPassword)
    setPwLoading(false)
    if (error) setPwMsg({ text: `Error: ${error.message}`, ok: false })
    else { setPwMsg({ text: 'Password updated successfully.', ok: true }); setNewPassword(''); setConfirmPassword('') }
  }

  const handleSignOutAll = async () => {
    setSigningOutAll(true); setSignOutMsg('')
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    setSigningOutAll(false)
    if (error) setSignOutMsg('Failed to sign out other sessions.')
    else setSignOutMsg('All other sessions signed out.')
    setTimeout(() => setSignOutMsg(''), 4000)
  }

  const requestDeletion = async () => {
    setDeletionLoading(true)
    const ts = new Date().toISOString()
    await supabase.from('users').update({ deletion_requested_at: ts }).eq('id', user.id)
    setDeletionRequestedAt(ts)
    setDeletionLoading(false)
    setConfirmingDelete(false)
  }

  const cancelDeletionRequest = async () => {
    setDeletionLoading(true)
    await supabase.from('users').update({ deletion_requested_at: null }).eq('id', user.id)
    setDeletionRequestedAt(null)
    setDeletionLoading(false)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

      {/* Profile */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Profile</SectionTitle>
        <div className="flex flex-col gap-3">

          {/* Display name */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Display name</p>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Your name (optional)"
                  className={inputClass} style={inputStyle}
                  onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={saveDisplayName} disabled={nameSaving}
                  className="p-2.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                  style={{ background: '#0f1117', border: '1px solid #2a2d3a' }}>
                  <Check size={15} />
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(displayName) }}
                  className="p-2.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                  style={{ background: '#0f1117', border: '1px solid #2a2d3a' }}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingName(true)}
                className="flex items-center gap-2 text-sm text-slate-200 hover:text-white group">
                <span>{displayName || <span className="text-slate-500 italic">Not set</span>}</span>
                <Pencil size={12} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>
            )}
          </div>

          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: '#2a2d3a' }}>
            <div>
              <p className="text-xs text-slate-500 mb-1">Access ID</p>
              <p className="text-sm font-mono font-semibold text-slate-100">#{userCode ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Role</p>
              <RoleBadge role={role} />
            </div>
            {joinedAt && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Member since</p>
                <p className="text-xs text-slate-300">{format(new Date(joinedAt), 'd MMM yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Security</SectionTitle>
        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3 mb-4">
          <p className="text-xs text-slate-500 -mt-1">Change password</p>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-3 text-slate-500 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} placeholder="New password (min 6 chars)"
              minLength={6} required value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input type={showPw ? 'text' : 'password'} placeholder="Confirm new password"
            minLength={6} required value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={inputClass} style={inputStyle} />
          {pwMsg.text && (
            <p className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</p>
          )}
          <button type="submit" disabled={pwLoading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white w-fit disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        <div className="pt-3 border-t" style={{ borderColor: '#2a2d3a' }}>
          <p className="text-xs text-slate-500 mb-2">Active sessions</p>
          {confirmSignOut ? (
            <div className="rounded-lg p-3 border" style={{ background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.2)' }}>
              <p className="text-xs text-slate-300 mb-2">Sign out all other active sessions? You will remain logged in here.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmSignOut(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200">
                  Cancel
                </button>
                <button onClick={() => { setConfirmSignOut(false); handleSignOutAll() }} disabled={signingOutAll}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: '#ea580c' }}>
                  {signingOutAll ? 'Signing out…' : 'Yes, sign out all'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmSignOut(true)} disabled={signingOutAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 border hover:border-slate-500 transition-colors disabled:opacity-50"
              style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
              <LogOut size={14} className="text-slate-500" />
              Sign out all other sessions
            </button>
          )}
          {signOutMsg && <p className="text-xs text-emerald-400 mt-2">{signOutMsg}</p>}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: 'rgba(239,68,68,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-red-400" />
          <SectionTitle><span className="text-red-400">Danger Zone</span></SectionTitle>
        </div>

        {deletionRequestedAt ? (
          <div className="rounded-lg p-3 border" style={{ background: 'rgba(234,179,8,0.05)', borderColor: 'rgba(234,179,8,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={13} className="text-amber-400 shrink-0" />
              <p className="text-sm font-semibold text-amber-400">Deletion Requested</p>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Requested on {format(new Date(deletionRequestedAt), 'd MMM yyyy')}. Your account will remain active until an admin approves the request.
            </p>
            <button onClick={cancelDeletionRequest} disabled={deletionLoading}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors disabled:opacity-50">
              {deletionLoading ? 'Cancelling…' : 'Cancel deletion request'}
            </button>
          </div>
        ) : confirmingDelete ? (
          <div className="rounded-lg p-3 border" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <p className="text-sm font-semibold text-red-400 mb-1">Are you sure?</p>
            <p className="text-xs text-slate-400 mb-3">
              This will submit a deletion request. An admin must approve it before your account is deleted. You can cancel the request at any time before then.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmingDelete(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </button>
              <button onClick={requestDeletion} disabled={deletionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: '#dc2626' }}>
                {deletionLoading ? 'Requesting…' : 'Yes, request deletion'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">
              Requesting deletion will notify an admin. Your account remains active until they approve.
            </p>
            <button onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              style={{ background: 'transparent' }}>
              <AlertTriangle size={14} />
              Request Account Deletion
            </button>
          </>
        )}
      </div>

      {/* Help & Contact — only shown when admin has configured it */}
      {(appSettings.help_message || appSettings.help_email) && (
        <div className="rounded-xl p-4 border mt-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={14} className="text-indigo-400" />
            <SectionTitle>Need Help?</SectionTitle>
          </div>
          {appSettings.help_message && (
            <p className="text-sm text-slate-300 mb-3">{appSettings.help_message}</p>
          )}
          {appSettings.help_email && (
            <a
              href={`mailto:${appSettings.help_email}`}
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Mail size={14} />
              {appSettings.help_email}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
