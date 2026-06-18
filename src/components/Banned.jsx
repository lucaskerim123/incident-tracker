import { ShieldOff } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'

export default function Banned() {
  const { signOut, userCode, banReason, banExpiresAt } = useAuth()

  const expiryLabel = banExpiresAt
    ? `Until ${format(new Date(banExpiresAt), 'd MMM yyyy HH:mm')}`
    : 'Permanent'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.15)' }}>
          <ShieldOff size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Account Banned</h1>
        <p className="text-sm text-slate-400 mt-2">
          Your account {userCode ? `(#${userCode})` : ''} has been banned from this platform.
        </p>
        {banReason && (
          <p className="text-sm text-slate-500 mt-2">
            Reason: <span className="text-slate-300">{banReason}</span>
          </p>
        )}
        <p className="text-sm font-bold mt-3 text-red-400">
          {expiryLabel}
        </p>
        <button onClick={signOut}
          className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Sign out
        </button>
      </div>
    </div>
  )
}
