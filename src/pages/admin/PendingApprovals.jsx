import { useEffect, useState } from 'react'
import { Clock, ExternalLink, CheckCircle, ShieldOff, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'

export default function PendingApprovals() {
  const { user } = useAuth()
  const { isAdmin } = usePermissions()

  const [deletions, setDeletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState({})       // { id: true } — tracks which rows had Drive opened
  const [confirming, setConfirming] = useState({}) // { id: true } — showing inline confirm
  const [dismissing, setDismissing] = useState({}) // { id: true } — loading state

  useEffect(() => {
    supabase
      .from('pending_gdrive_deletions')
      .select('id, google_doc_id, doc_name, deleted_by, deleted_at, users!deleted_by(user_code)')
      .eq('dismissed', false)
      .order('deleted_at', { ascending: false })
      .then(({ data }) => { setDeletions(data ?? []); setLoading(false) })
  }, [])

  const openInDrive = (row) => {
    window.open(`https://drive.google.com/file/d/${row.google_doc_id}`, '_blank')
    setOpened(o => ({ ...o, [row.id]: true }))
  }

  const startConfirm = (id) => setConfirming(c => ({ ...c, [id]: true }))
  const cancelConfirm = (id) => setConfirming(c => ({ ...c, [id]: false }))

  const dismiss = async (id) => {
    setDismissing(d => ({ ...d, [id]: true }))
    await supabase.from('pending_gdrive_deletions').update({
      dismissed: true,
      dismissed_by: user?.id ?? null,
      dismissed_at: new Date().toISOString(),
    }).eq('id', id)
    setDeletions(d => d.filter(x => x.id !== id))
    setDismissing(d => ({ ...d, [id]: false }))
  }

  if (!isAdmin) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-20">
      <ShieldOff size={32} className="text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-500">Only admins can view pending approvals.</p>
    </div>
  )

  return (
    <div className="p-4 max-w-2xl mx-auto pb-10">
      <h1 className="text-xl font-bold text-slate-100 mb-1">Pending Approvals</h1>
      <p className="text-xs text-slate-500 mb-6">Actions that require manual follow-up outside the app.</p>

      {/* Google Drive Deletions */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#2a2d3a', background: '#0f1117' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex-1">Google Drive Deletions</p>
          {!loading && deletions.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
              {deletions.length} pending
            </span>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deletions.length === 0 ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <CheckCircle size={20} className="text-emerald-500" />
              <p className="text-sm text-slate-400">All clear — no pending Drive deletions.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 rounded-lg mb-2 border"
                style={{ background: 'rgba(234,179,8,0.05)', borderColor: 'rgba(234,179,8,0.2)' }}>
                <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  These Google Docs were removed from the app but still exist in Google Drive.
                  Open each file in Drive, delete it, then mark it as deleted here.
                </p>
              </div>

              {deletions.map(row => (
                <div key={row.id} className="rounded-lg border overflow-hidden" style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
                  <div className="flex items-start justify-between gap-3 p-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {row.doc_name ?? <span className="italic text-slate-500">Untitled document</span>}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {row.users?.user_code && (
                          <span className="text-xs text-slate-500 font-mono">deleted by #{row.users.user_code}</span>
                        )}
                        <span className="text-xs text-slate-600">
                          {format(new Date(row.deleted_at), 'd MMM yyyy HH:mm')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openInDrive(row)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        <ExternalLink size={12} />
                        Open in Drive
                      </button>

                      <button
                        onClick={() => startConfirm(row.id)}
                        disabled={!opened[row.id] || dismissing[row.id]}
                        title={!opened[row.id] ? 'Open in Drive first' : undefined}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={opened[row.id]
                          ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                          : { background: '#1a1d27', color: '#475569' }}>
                        <CheckCircle size={12} />
                        Mark as Deleted
                      </button>
                    </div>
                  </div>

                  {confirming[row.id] && (
                    <div className="px-3 pb-3 border-t pt-3 flex items-center justify-between gap-3"
                      style={{ borderColor: '#2a2d3a', background: 'rgba(239,68,68,0.04)' }}>
                      <p className="text-xs text-slate-300">
                        Confirm you have deleted this file from Google Drive?
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => cancelConfirm(row.id)}
                          className="px-2.5 py-1 rounded text-xs text-slate-500 hover:text-slate-300 transition-colors">
                          Cancel
                        </button>
                        <button onClick={() => dismiss(row.id)} disabled={dismissing[row.id]}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                          style={{ background: '#ef4444' }}>
                          {dismissing[row.id] ? 'Saving…' : 'Confirm Deleted'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
