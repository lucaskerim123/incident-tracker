import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative rounded-xl p-6 w-full max-w-sm shadow-2xl border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)' }}>
            <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-indigo-400'} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
