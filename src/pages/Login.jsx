import { useState } from 'react'
import { Shield, Hash, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const onlyDigits = (v) => v.replace(/\D/g, '').slice(0, 6)

export default function Login() {
  const { session, signInWithId, registerWithInvite } = useAuth()
  const [tab, setTab] = useState('login')

  // Login state
  const [userId, setUserId] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Register state
  const [regId, setRegId] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [newPin, setNewPin] = useState('')
  const [showRegPin, setShowRegPin] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regDone, setRegDone] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!userId.trim() || pin.length < 4) return
    setLoading(true); setError('')
    const { error } = await signInWithId(userId.trim(), pin)
    setLoading(false)
    if (error) setError('Invalid ID or PIN.')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regId.trim() || !inviteToken.trim() || newPin.length < 4) {
      setRegError('Please fill all fields. PIN must be 4–6 digits.'); return
    }
    setRegLoading(true); setRegError('')
    const { error } = await registerWithInvite(regId.trim(), inviteToken.trim(), newPin)
    setRegLoading(false)
    if (error) setRegError(typeof error === 'string' ? error : error.message)
    else setRegDone(true)
  }

  const inputClass = 'w-full rounded-xl px-4 py-3 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
  const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Shield size={28} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Incident Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Private & Secure</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          {/* Tab toggle */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: '#0f1117' }}>
            {[['login', 'Sign In'], ['register', 'First Login']].map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); setError(''); setRegError('') }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${tab === key ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
                style={tab === key ? { background: '#2a2d3a' } : {}}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="text" inputMode="numeric" placeholder="ID (e.g. 1000)"
                  required value={userId}
                  onChange={e => setUserId(e.target.value.replace(/\D/g, ''))}
                  className={`${inputClass} pl-9`} style={inputStyle} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  placeholder="PIN (4–6 digits)"
                  required
                  value={pin}
                  onChange={e => setPin(onlyDigits(e.target.value))}
                  className={`${inputClass} pl-9 pr-10`}
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading || pin.length < 4}
                className="w-full py-3 rounded-xl font-semibold text-white mt-1 disabled:opacity-50"
                style={{ background: '#6366f1' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : regDone ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <UserPlus size={24} className="text-emerald-400" />
              </div>
              <p className="font-semibold text-slate-100">Account created!</p>
              <p className="text-sm text-slate-400 mt-1">Sign in with your ID and PIN.</p>
              <button onClick={() => { setTab('login'); setRegDone(false); setRegId(''); setInviteToken(''); setNewPin('') }}
                className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">
                Go to Sign In →
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 mb-1">Enter the ID and invite code your admin gave you, then set your PIN.</p>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="text" inputMode="numeric" placeholder="Your Access ID (e.g. 1001)"
                  required value={regId}
                  onChange={e => setRegId(e.target.value.replace(/\D/g, ''))}
                  className={`${inputClass} pl-9`} style={inputStyle} />
              </div>
              <input type="text" placeholder="Invite code (from admin)"
                required value={inviteToken}
                onChange={e => setInviteToken(e.target.value.trim())}
                className={inputClass} style={inputStyle} />
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input
                  type={showRegPin ? 'text' : 'password'}
                  inputMode="numeric"
                  placeholder="Set your PIN (4–6 digits)"
                  required
                  value={newPin}
                  onChange={e => setNewPin(onlyDigits(e.target.value))}
                  className={`${inputClass} pl-9 pr-10`}
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowRegPin(v => !v)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                  {showRegPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPin.length > 0 && newPin.length < 4 && (
                <p className="text-xs text-slate-500">Enter {4 - newPin.length} more digit{4 - newPin.length !== 1 ? 's' : ''}</p>
              )}
              {regError && <p className="text-xs text-red-400">{regError}</p>}
              <button type="submit" disabled={regLoading || newPin.length < 4}
                className="w-full py-3 rounded-xl font-semibold text-white mt-1 disabled:opacity-50"
                style={{ background: '#6366f1' }}>
                {regLoading ? 'Setting up…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
