import { useEffect, useState } from 'react'
import { X, Pencil, Check, ShieldOff } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { usePermissions } from '../../hooks/usePermissions'

export default function BanList() {
  const { can } = usePermissions()
  const [banList, setBanList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editReason, setEditReason] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    supabase.from('ban_list').select('id, type, value, reason, banned_by, created_at').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { setBanList(data ?? []); setLoading(false) })

    const channel = supabase.channel('admin-ban-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ban_list' }, () => {
        supabase.from('ban_list').select('id, type, value, reason, banned_by, created_at').eq('is_active', true).order('created_at', { ascending: false })
          .then(({ data }) => setBanList(data ?? []))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const removeBan = async (banId) => {
    setActionError('')
    const { error } = await supabase.rpc('remove_ban', { p_id: banId })
    if (error) { setActionError(`Failed to remove ban: ${error.message}`); return }
    setBanList(b => b.filter(x => x.id !== banId))
  }

  const startEdit = (b) => {
    setEditingId(b.id)
    setEditReason(b.reason ?? '')
  }

  const saveEdit = async (banId) => {
    setEditLoading(true); setActionError('')
    const { error } = await supabase.from('ban_list').update({ reason: editReason.trim() || null }).eq('id', banId)
    setEditLoading(false)
    if (error) { setActionError(`Failed to update reason: ${error.message}`); return }
    setBanList(b => b.map(x => x.id === banId ? { ...x, reason: editReason.trim() || null } : x))
    setEditingId(null)
  }

  const typeBg = { ip: 'rgba(239,68,68,0.12)', email: 'rgba(234,179,8,0.12)', user: 'rgba(99,102,241,0.12)' }
  const typeColor = { ip: '#f87171', email: '#eab308', user: '#818cf8' }

  if (!can.manageUsers) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-20">
      <ShieldOff size={32} className="text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-500">You do not have permission to view this page.</p>
    </div>
  )

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Ban List</h1>
        <span className="text-xs text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Live
        </span>
      </div>
      {actionError && (
        <div className="mb-3 p-3 rounded-lg text-xs text-red-300 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          {actionError}
        </div>
      )}

      <div className="rounded-xl border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        {loading ? (
          <p className="text-xs text-slate-600 p-4">Loading…</p>
        ) : banList.length === 0 ? (
          <p className="text-xs text-slate-600 p-4">No active bans.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#2a2d3a' }}>
            {banList.map(b => (
              <div key={b.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ background: typeBg[b.type] ?? typeBg.user, color: typeColor[b.type] ?? typeColor.user }}>
                      {b.type?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-200 truncate">{b.value}</p>
                      {editingId === b.id ? (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <input
                            autoFocus
                            value={editReason}
                            onChange={e => setEditReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="flex-1 rounded px-2 py-1 text-xs text-slate-300 border outline-none focus:border-indigo-500 transition-colors"
                            style={{ background: '#0f1117', borderColor: '#2a2d3a' }}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(b.id); if (e.key === 'Escape') setEditingId(null) }}
                          />
                          <button onClick={() => saveEdit(b.id)} disabled={editLoading}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors disabled:opacity-50">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 mt-0.5">{b.reason ?? <span className="italic">No reason</span>}</p>
                      )}
                      <p className="text-[10px] text-slate-700 mt-0.5">{b.created_at && format(new Date(b.created_at), 'd MMM yyyy HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId !== b.id && (
                      <button onClick={() => startEdit(b)}
                        className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors" title="Edit reason">
                        <Pencil size={12} />
                      </button>
                    )}
                    <button onClick={() => removeBan(b.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Remove ban">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
