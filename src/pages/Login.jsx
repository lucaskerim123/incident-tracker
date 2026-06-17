import { useState, useEffect } from 'react'
import { Shield, Hash, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { session, signInWithId, registerFirstUser, registerWithInvite } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [hasUsers, setHasUsers] = useState(null) // null = loading

  // Login state
  const [userId, setUserId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Register state
  const [regId, setRegId] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [showRegPw, setShowRegPw] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regDone, setRegDone] = useState(false)
  const [assignedCode, setAssignedCode] = useState(null)

  useEffect(() => {
    supabase.rpc('has_any_users').then(({ data }) => setHasUsers(!!data))
  }, [])

  if (session) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!userId.trim() || !passcode) return
    setLoading(true); setError('')
    const { error } = await signInWithId(userId.trim(), passcode)
    setLoading(false)
    if (error) setError('Invalid ID or passcode.')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegLoading(true); setRegError('')

    if (!hasUsers) {
      // First-ever user setup — no invite needed
      const { userCode, error } = await registerFirstUser(newPasscode)
      setRegLoading(false)
      if (error) setRegError(error)
      else { setAssignedCode(userCode); setRegDone(true) }
    } else {
      // Invited user — needs ID + invite token
      if (!regId.trim() || !inviteToken.trim() || !newPasscode) { setRegLoading(false); return }
      const { error } = await registerWithInvite(regId.trim(), inviteToken.trim(), newPasscode)
      setRegLoading(false)
      if (error) setRegError(error)
      else setRegDone(true)
    }
  }

  const inputClass = 'w-full rounded-xl px-4 py-3 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
  const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

  const isFirstSetup = hasUsers === false

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
          {/* Tab toggle — hide register tab if first setup (auto-show it) */}
          {!isFirstSetup && (
            <div className="flex rounded-lg p-1 mb-6" style={{ background: '#0f1117' }}>
              {[['login', 'Sign In'], ['register', 'First Login']].map(([key, label]) => (
                <button key={key} onClick={() => { setTab(key); setError(''); setRegError('') }}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${tab === key ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
                  style={tab === key ? { background: '#2a2d3a' } : {}}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {isFirstSetup ? (
            /* ── First-time admin setup ── */
            regDone ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <UserPlus size={24} className="text-emerald-400" />
                </div>
                <p className="font-semibold text-slate-100">Admin account created!</p>
                <p className="text-sm text-slate-400 mt-1">Your Access ID is <span className="font-mono text-indigo-400">#{assignedCode}</span></p>
                <p className="text-xs text-slate-500 mt-1">Sign in with that ID and your passcode.</p>
                <button onClick={() => { setTab('login'); setRegDone(false); setNewPasscode(''); setHasUsers(true) }}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">
                  Go to Sign In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="p-3 rounded-lg mb-1" style={{ background: 'rgba(99,102,241,0.1)', borderColor: '#6366f1' }}>
                  <p className="text-xs text-indigo-300 font-semibold">First-time setup</p>
                  <p className="text-xs text-slate-400 mt-0.5">You're the first user. Set your passcode to create the admin account. Your Access ID will be assigned automatically.</p>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type={showRegPw ? 'text' : 'password'} placeholder="Set your passcode (min 6 chars)"
                    required minLength={6} value={newPasscode}
                    onChange={e => setNewPasscode(e.target.value)}
                    className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowRegPw(v => !v)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                    {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regError && <p className="text-xs text-red-400">{regError}</p>}
                <button type="submit" disabled={regLoading}
                  className="w-full py-3 rounded-xl font-semibold text-white mt-1 disabled:opacity-50"
                  style={{ background: '#6366f1' }}>
                  {regLoading ? 'Setting up…' : 'Create Admin Account'}
                </button>
              </form>
            )
          ) : tab === 'login' ? (
            /* ── Sign in ── */
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="text" inputMode="numeric" placeholder="Access ID (e.g. 1001)"
                  required value={userId}
                  onChange={e => setUserId(e.target.value.replace(/\D/g, ''))}
                  className={`${inputClass} pl-9`} style={inputStyle} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type={showPw ? 'text' : 'password'} placeholder="Passcode"
                  required value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white mt-1 disabled:opacity-50"
                style={{ background: '#6366f1' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : regDone ? (
            /* ── Registration success ── */
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <UserPlus size={24} className="text-emerald-400" />
              </div>
              <p className="font-semibold text-slate-100">Account created!</p>
              <p className="text-sm text-slate-400 mt-1">Sign in with your ID and new passcode.</p>
              <button onClick={() => { setTab('login'); setRegDone(false); setRegId(''); setInviteToken(''); setNewPasscode('') }}
                className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">
                Go to Sign In →
              </button>
            </div>
          ) : (
            /* ── Invited user registration ── */
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 mb-1">Enter the Access ID and invite code your admin gave you, then set your passcode.</p>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="text" inputMode="numeric" placeholder="Your Access ID"
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
                <input type={showRegPw ? 'text' : 'password'} placeholder="Set your passcode (min 6 chars)"
                  required minLength={6} value={newPasscode}
                  onChange={e => setNewPasscode(e.target.value)}
                  className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
                <button type="button" onClick={() => setShowRegPw(v => !v)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                  {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {regError && <p className="text-xs text-red-400">{regError}</p>}
              <button type="submit" disabled={regLoading}
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
