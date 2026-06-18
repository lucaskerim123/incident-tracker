import { Ban } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'

export default function Suspended() {
  const { signOut, userCode, suspensionReason, suspensionExpiresAt } = useAuth()

  const expiryLabel = suspensionExpiresAt
    ? `Until ${format(new Date(suspensionExpiresAt), 'd MMM yyyy HH:mm')}`
    : 'Indefinitely'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(234,179,8,0.15)' }}>
          <Ban size={28} className="text-yellow-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Account Suspended</h1>
        <p className="text-sm text-slate-400 mt-2">
          Your account {userCode ? `(#${userCode})` : ''} has been suspended.
        </p>
        {suspensionReason && (
          <p className="text-sm text-slate-500 mt-2">
            Reason: <span className="text-slate-300">{suspensionReason}</span>
          </p>
        )}
        <p className="text-sm font-medium mt-3" style={{ color: '#eab308' }}>
          {expiryLabel}
        </p>
        <p className="text-xs text-slate-600 mt-3">
          Contact an administrator if you believe this is a mistake.
        </p>
        <button onClick={signOut}
          className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Sign out
        </button>
      </div>
    </div>
  )
}
