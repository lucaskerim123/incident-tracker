import { useState } from 'react'
import { Shield, Hash, Lock, Eye, EyeOff } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { session, signInWithId } = useAuth()
  const [userId, setUserId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (session) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!userId.trim() || !passcode) return
    setLoading(true); setError('')
    const { error } = await signInWithId(userId.trim(), passcode)
    setLoading(false)
    if (error) setError('Invalid ID or passcode.')
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
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
              <input type="text" inputMode="numeric" placeholder="Access ID (e.g. 1000)"
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

          <p className="text-center text-xs text-slate-500 mt-4">
            New user?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
