import { useState } from 'react'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export default function Login() {
  const { session, signIn, signInWithPassword } = useAuth()
  const [mode, setMode] = useState('magic') // 'magic' | 'password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (session) return <Navigate to="/" replace />

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) setError(error.message)
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
          {/* Mode toggle */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: '#0f1117' }}>
            {['magic', 'password'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSent(false) }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${mode === m ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
                style={mode === m ? { background: '#2a2d3a' } : {}}>
                {m === 'magic' ? 'Magic Link' : 'Password'}
              </button>
            ))}
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Mail size={24} className="text-emerald-400" />
              </div>
              <p className="font-semibold text-slate-100">Check your email</p>
              <p className="text-sm text-slate-400 mt-1">A magic link has been sent to<br /><strong className="text-slate-200">{email}</strong></p>
              <button onClick={() => setSent(false)} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">Try a different email</button>
            </div>
          ) : (
            <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="flex flex-col gap-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="email" placeholder="your@email.com" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className={`${inputClass} pl-9`} style={inputStyle} />
              </div>
              {mode === 'password' && (
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white mt-1 transition-colors disabled:opacity-50"
                style={{ background: '#6366f1' }}>
                {loading ? 'Please wait…' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
