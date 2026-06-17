import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'
import { User, Lock, Eye, EyeOff } from 'lucide-react'

const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

function SectionTitle({ children }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{children}</h2>
}

export default function Profile() {
  const { user, userCode, updatePasscode } = useAuth()
  const { role } = usePermissions()
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const rs = ROLE_STYLES[role] ?? ROLE_STYLES.viewer

  const handleUpdatePasscode = async (e) => {
    e.preventDefault()
    if (newPasscode !== confirmPasscode) { setMsg('Passcodes do not match.'); return }
    setLoading(true); setMsg('')
    const { error } = await updatePasscode(newPasscode)
    setLoading(false)
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Passcode updated successfully.'); setNewPasscode(''); setConfirmPasscode('') }
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-6">My Profile</h1>

      {/* Identity card */}
      <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Account Info</SectionTitle>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <User size={20} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold text-slate-100">
                #{userCode ?? '—'}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: rs.bg, color: rs.text }}>
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Change passcode */}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionTitle>Change Passcode</SectionTitle>
        <form onSubmit={handleUpdatePasscode} className="flex flex-col gap-3">
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3 text-slate-500 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} placeholder="New passcode (min 6 chars)"
              minLength={6} required value={newPasscode}
              onChange={e => setNewPasscode(e.target.value)}
              className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input type={showPw ? 'text' : 'password'} placeholder="Confirm new passcode"
            minLength={6} required value={confirmPasscode}
            onChange={e => setConfirmPasscode(e.target.value)}
            className={inputClass} style={inputStyle} />
          {msg && (
            <p className={`text-xs ${msg.startsWith('Error') || msg.includes('match') ? 'text-red-400' : 'text-emerald-400'}`}>
              {msg}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white w-fit disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            {loading ? 'Updating…' : 'Update Passcode'}
          </button>
        </form>
      </div>
    </div>
  )
}
