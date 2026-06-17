import { useEffect, useState } from 'react'
import { Download, Lock, Eye, EyeOff, Pencil, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import { format } from 'date-fns'

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

  // Account info
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [joinedAt, setJoinedAt] = useState(null)

  // Passcode
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false })

  // Export
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('users').select('display_name, created_at').eq('id', user.id).single()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? '')
        setNameInput(data?.display_name ?? '')
        setJoinedAt(data?.created_at ?? null)
      })
  }, [user])

  const saveDisplayName = async () => {
    setNameSaving(true)
    await supabase.from('users').update({ display_name: nameInput.trim() || null }).eq('id', user.id)
    setDisplayName(nameInput.trim())
    setNameSaving(false)
    setEditingName(false)
  }

  const handleUpdatePasscode = async (e) => {
    e.preventDefault()
    if (newPasscode !== confirmPasscode) {
      setPwMsg({ text: 'Passcodes do not match.', ok: false }); return
    }
    setPwLoading(true); setPwMsg({ text: '', ok: false })
    const { error } = await updatePasscode(newPasscode)
    setPwLoading(false)
    if (error) setPwMsg({ text: `Error: ${error.message}`, ok: false })
    else { setPwMsg({ text: 'Passcode updated.', ok: true }); setNewPasscode(''); setConfirmPasscode('') }
  }

  const exportIncidents = async () => {
    setExportLoading(true)
    const { data } = await supabase.from('incidents').select('*').order('date')
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `incidents_${new Date().toISOString().slice(0, 10)}.json`
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
      const a = document.createElement('a'); a.href = url; a.download = `incidents_${new Date().toISOString().slice(0, 10)}.csv`
      a.click(); URL.revokeObjectURL(url)
    }
    setExportLoading(false)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

      {/* Account info */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Account</SectionTitle>
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
            <div>
              <p className="text-xs text-slate-500 mb-1">Auth email</p>
              <p className="text-xs text-slate-600 font-mono truncate">{user?.email ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change passcode */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Change Passcode</SectionTitle>
        <form onSubmit={handleUpdatePasscode} className="flex flex-col gap-3">
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-3 text-slate-500 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} placeholder="New passcode (min 6 chars)"
              minLength={6} required value={newPasscode}
              onChange={e => setNewPasscode(e.target.value)}
              className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input type={showPw ? 'text' : 'password'} placeholder="Confirm new passcode"
            minLength={6} required value={confirmPasscode}
            onChange={e => setConfirmPasscode(e.target.value)}
            className={inputClass} style={inputStyle} />
          {pwMsg.text && (
            <p className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</p>
          )}
          <button type="submit" disabled={pwLoading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white w-fit disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            {pwLoading ? 'Updating…' : 'Update Passcode'}
          </button>
        </form>
      </div>

      {/* Export — users with export permission */}
      {can.export && (
        <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <SectionTitle>Export Data</SectionTitle>
          <p className="text-xs text-slate-500 mb-3">Download a full copy of all incidents.</p>
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
    </div>
  )
}
