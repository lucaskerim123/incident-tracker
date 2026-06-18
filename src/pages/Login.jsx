import { useState } from 'react'
import { Shield, Hash, Lock, Eye, EyeOff, Clock, KeyRound, ArrowLeft, Copy, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { session, signInWithId } = useAuth()
  const [tab, setTab] = useState('login')

  // Sign in
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotCode, setForgotCode] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDone, setForgotDone] = useState(false)
  const [forgotToken, setForgotToken] = useState('')
  const [forgotError, setForgotError] = useState('')

  // Register
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPw, setShowRegPw] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regDone, setRegDone] = useState(false)
  const [assignedCode, setAssignedCode] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!userId.trim() || !password) return
    setLoading(true); setError('')
    const { error } = await signInWithId(userId.trim(), password)
    setLoading(false)
    if (error) {
      if (error.message && error.message !== 'Invalid login credentials') {
        setError(error.message)
      } else {
        setError('Invalid access ID or password.')
      }
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!forgotCode.trim()) return
    if (forgotToken.length !== 4) return
    setForgotLoading(true); setForgotError('')
    const { error } = await supabase.rpc('request_password_reset', { in_user_code: forgotCode.trim(), in_token: forgotToken })
    setForgotLoading(false)
    if (error) setForgotError('Something went wrong. Try again.')
    else setForgotDone(true)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (regPassword !== regConfirm) { setRegError("Passwords don't match."); return }
    if (regPassword.length < 6) { setRegError('Minimum 6 characters.'); return }
    setRegLoading(true); setRegError('')
    const { data, error } = await supabase.rpc('register_user', { in_password: regPassword })
    setRegLoading(false)
    if (error) setRegError(error.message)
    else { setAssignedCode(data?.user_code); setRegDone(true) }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(String(assignedCode))
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const resetLogin = () => { setTab('login'); setForgotMode(false); setForgotDone(false); setForgotCode(''); setForgotToken(''); setForgotError('') }
  const resetRegister = () => { setRegDone(false); setRegPassword(''); setRegConfirm(''); setAssignedCode(null) }

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
                <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input type="text" inputMode="numeric" placeholder="Access ID (e.g. 1000)"
                  required value={userId}
                  onChange={e => setUserId(e.target.value.replace(/\D/g, ''))}
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
                  An admin will verify the code with you before resetting your password.
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
                <p className="text-xs text-slate-500 leading-relaxed">Enter your access ID and pick a 4-digit confirmation code. Share it with an admin — they'll verify it before resetting your password.</p>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                  <input type="text" inputMode="numeric" placeholder="Your Access ID"
                    required value={forgotCode}
                    onChange={e => setForgotCode(e.target.value.replace(/\D/g, ''))}
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
                <p className="font-semibold text-slate-100 mb-3">Account created!</p>

                {/* Assigned code — prominent */}
                <div className="rounded-xl p-4 mb-3" style={{ background: '#0f1117', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <p className="text-xs text-slate-500 mb-1">Your Access ID</p>
                  <p className="text-4xl font-mono font-bold text-indigo-400 mb-1">#{assignedCode}</p>
                  <p className="text-xs text-slate-500">Use this to sign in — save it now</p>
                  <button onClick={copyCode}
                    className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mx-auto transition-colors">
                    {codeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {codeCopied ? 'Copied!' : 'Copy ID'}
                  </button>
                </div>

                <p className="text-sm text-slate-400">Awaiting admin approval before you can sign in.</p>
                <button onClick={() => { setTab('login'); resetRegister() }}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">
                  Go to Sign In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 mb-1">
                  Set a password. Your access ID will be assigned automatically.
                </p>
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
