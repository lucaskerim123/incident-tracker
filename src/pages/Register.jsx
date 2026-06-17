import { useState, useEffect } from 'react'
import { Shield, Hash, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Register() {
  const { session, registerFirstUser, registerWithInvite } = useAuth()
  const [hasUsers, setHasUsers] = useState(null)

  const [regId, setRegId] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [assignedCode, setAssignedCode] = useState(null)

  useEffect(() => {
    supabase.rpc('has_any_users').then(({ data }) => setHasUsers(!!data))
  }, [])

  if (session) return <Navigate to="/" replace />
  if (hasUsers === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1117' }}>
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isFirstSetup = hasUsers === false

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')

    if (isFirstSetup) {
      const { userCode, error: err } = await registerFirstUser(newPasscode)
      setLoading(false)
      if (err) setError(err)
      else { setAssignedCode(userCode); setDone(true) }
    } else {
      if (!regId.trim() || !inviteToken.trim() || !newPasscode) { setLoading(false); return }
      const { error: err } = await registerWithInvite(regId.trim(), inviteToken.trim(), newPasscode)
      setLoading(false)
      if (err) setError(err)
      else setDone(true)
    }
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
          <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isFirstSetup ? 'First-time admin setup' : 'Invited user registration'}
          </p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <UserPlus size={24} className="text-emerald-400" />
              </div>
              <p className="font-semibold text-slate-100">
                {isFirstSetup ? 'Admin account created!' : 'Account created!'}
              </p>
              {assignedCode && (
                <p className="text-sm text-slate-400 mt-1">
                  Your Access ID is <span className="font-mono text-indigo-400">#{assignedCode}</span>
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Sign in with your ID and passcode.</p>
              <Link to="/login" className="mt-4 inline-block text-xs text-indigo-400 hover:text-indigo-300">
                Go to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {isFirstSetup ? (
                <div className="p-3 rounded-lg mb-1" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <p className="text-xs text-indigo-300 font-semibold">First-time setup</p>
                  <p className="text-xs text-slate-400 mt-0.5">You're the first user. Set your passcode to create the admin account. Your Access ID will be assigned automatically.</p>
                </div>
              ) : (
                <>
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
                </>
              )}

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type={showPw ? 'text' : 'password'} placeholder="Set your passcode (min 6 chars)"
                  required minLength={6} value={newPasscode}
                  onChange={e => setNewPasscode(e.target.value)}
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
                {loading ? 'Setting up…' : isFirstSetup ? 'Create Admin Account' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-500 mt-1">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
