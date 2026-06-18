import { useState } from 'react'
import { Shield, Mail, User, Lock, Eye, EyeOff, Clock, KeyRound, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { session, signInWithEmail } = useAuth()
  const [tab, setTab] = useState('login')

  // Sign in
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotToken, setForgotToken] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDone, setForgotDone] = useState(false)
  const [forgotError, setForgotError] = useState('')

  // Register
  const [regEmail, setRegEmail] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPw, setShowRegPw] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regDone, setRegDone] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true); setError('')
    const { error } = await signInWithEmail(email.trim(), password)
    setLoading(false)
    if (error) {
      if (error.message && error.message !== 'Invalid login credentials') {
        setError(error.message)
      } else {
        setError('Invalid email or password.')
      }
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim() || forgotToken.length !== 4) return
    setForgotLoading(true); setForgotError('')
    const { error } = await supabase.rpc('request_password_reset', {
      in_email: forgotEmail.trim().toLowerCase(),
      in_token: forgotToken,
    })
    setForgotLoading(false)
    if (error) setForgotError('Something went wrong. Try again.')
    else setForgotDone(true)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (regPassword !== regConfirm) { setRegError("Passwords don't match."); return }
    if (regPassword.length < 6) { setRegError('Minimum 6 characters.'); return }
    setRegLoading(true); setRegError('')
    const { error } = await supabase.rpc('register_user', {
      in_email: regEmail.trim().toLowerCase(),
      in_password: regPassword,
      in_display_name: regDisplayName.trim() || null,
    })
    setRegLoading(false)
    if (error) setRegError(error.message)
    else setRegDone(true)
  }

  const resetLogin = () => {
    setTab('login'); setForgotMode(false); setForgotDone(false)
    setForgotEmail(''); setForgotToken(''); setForgotError('')
  }
  const resetRegister = () => {
    setRegDone(false); setRegEmail(''); setRegDisplayName('')
    setRegPassword(''); setRegConfirm('')
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
          {!forgotMode && (
            <div className="flex rounded-lg p-1 mb-6" style={{ background: '#0f1117' }}>
              {[['login', 'Sign In'], ['register', 'Register']].map(([key, label]) => (
                <button key={key} onClick={() => { setTab(key); setError(''); setRegError(''); setForgotMode(false) }}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${tab === key ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
                  style={tab === key ? { background: '#2a2d3a' } : {}}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Sign In ── */}
          {tab === 'login' && !forgotMode && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="email" placeholder="Email address"
                  required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`${inputClass} pl-9`} style={inputStyle} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type={showPw ? 'text' : 'password'} placeholder="Password"
                  required value={password}
                  onChange={e => setPassword(e.target.value)}
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
              <button type="button" onClick={() => { setForgotMode(true); setError('') }}
                className="text-xs text-slate-500 hover:text-indigo-400 transition-colors text-center mt-1">
                Forgot password?
              </button>
            </form>
          )}

          {/* ── Forgot Password ── */}
          {tab === 'login' && forgotMode && (
            forgotDone ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <KeyRound size={22} className="text-indigo-400" />
                </div>
                <p className="font-semibold text-slate-100">Request submitted</p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  An admin will verify your confirmation code and reset your password.
                </p>
                <button onClick={resetLogin}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto">
                  <ArrowLeft size={12} /> Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-3">
                <button type="button" onClick={resetLogin}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-1">
                  <ArrowLeft size={12} /> Back
                </button>
                <p className="text-sm font-semibold text-slate-100">Reset password</p>
                <p className="text-xs text-slate-500 leading-relaxed">Enter your email and pick a 4-digit confirmation code. Share it with an admin — they'll verify it before resetting your password.</p>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type="email" placeholder="Your email address"
                    required value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type="text" inputMode="numeric" placeholder="4-digit confirmation code"
                    required maxLength={4}
                    value={forgotToken}
                    onChange={e => setForgotToken(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
                {forgotError && <p className="text-xs text-red-400">{forgotError}</p>}
                <button type="submit" disabled={forgotLoading || forgotToken.length !== 4}
                  className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                  style={{ background: '#6366f1' }}>
                  {forgotLoading ? 'Submitting…' : 'Request Reset'}
                </button>
              </form>
            )
          )}

          {/* ── Register ── */}
          {tab === 'register' && (
            regDone ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(234,179,8,0.15)' }}>
                  <Clock size={22} className="text-yellow-400" />
                </div>
                <p className="font-semibold text-slate-100 mb-2">Account created!</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Awaiting admin approval. You'll be able to sign in with{' '}
                  <span className="text-slate-300">{regEmail}</span> once approved.
                </p>
                <button onClick={() => { setTab('login'); resetRegister() }}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">
                  Go to Sign In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type="email" placeholder="Email address"
                    required value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type="text" placeholder="Display name (optional)"
                    value={regDisplayName}
                    onChange={e => setRegDisplayName(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type={showRegPw ? 'text' : 'password'} placeholder="Password (min 6 chars)"
                    required minLength={6} value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className={`${inputClass} pl-9 pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowRegPw(v => !v)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                    {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type={showRegPw ? 'text' : 'password'} placeholder="Confirm password"
                    required minLength={6} value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
                {regError && <p className="text-xs text-red-400">{regError}</p>}
                <button type="submit" disabled={regLoading}
                  className="w-full py-3 rounded-xl font-semibold text-white mt-1 disabled:opacity-50"
                  style={{ background: '#6366f1' }}>
                  {regLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  )
}
