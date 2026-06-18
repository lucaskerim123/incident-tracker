import { Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function PendingApproval() {
  const { signOut, userCode } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(234,179,8,0.15)' }}>
          <Clock size={28} className="text-yellow-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Awaiting Approval</h1>
        <p className="text-sm text-slate-400 mt-2">
          Your account {userCode ? `(#${userCode})` : ''} has been created and is waiting for admin approval.
          You'll be able to access the app once an admin approves your account.
        </p>
        <button onClick={signOut}
          className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Sign out
        </button>
      </div>
    </div>
  )
}
