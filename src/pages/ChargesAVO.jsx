import { useEffect, useState, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { Plus, Pencil, Trash2, X, Search, Upload, FileText, AlertCircle, ExternalLink, Link2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { useGoogleDrive } from '../context/GoogleDriveContext'
import { uploadToDrive } from '../lib/googleDrive'
import ConfirmDialog from '../components/ConfirmDialog'
import DocumentViewer from '../components/DocumentViewer'

const IC = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const IS = { background: '#0f1117', borderColor: '#2a2d3a' }

// ─── Charges ────────────────────────────────────────────────────────────────

const CHARGE_STATUS     = ['active', 'withdrawn', 'closed']
const BREACH_TYPES      = ['avo', 'bail', 'ico']
const PLEA_OPTIONS      = ['no plea', 'guilty', 'not guilty']
const CONVICTION_OPTIONS = ['convicted', 'not convicted']

const CHARGE_STATUS_STYLE = {
  active:    { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  withdrawn: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  closed:    { bg: 'rgba(100,116,139,0.12)', text: '#64748b' },
  // legacy fallbacks
  pending:   { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  adjourned: { bg: 'rgba(234,179,8,0.12)',   text: '#eab308' },
  finalised: { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
}

const BREACH_STYLE = {
  avo:  { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  bail: { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  ico:  { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
}

const EMPTY_CHARGE = { charge_number: '', date_of_charge: '', breach_type: '', linked_incident_id: '', plea: '', outcome: '', status: 'active', conviction_status: '', notes: '', fact_sheet_url: '' }

function ChargeForm({ initial = EMPTY_CHARGE, incidents, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.status) { setError('Status is required.'); return }
    setError('')
    onSave(form)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Charge number (H …)" value={form.charge_number} onChange={e => set('charge_number', e.target.value)}
          className={IC} style={IS} />
        <input type="date" value={form.date_of_charge} onChange={e => set('date_of_charge', e.target.value)}
          className={IC} style={{ ...IS, colorScheme: 'dark' }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.breach_type} onChange={e => set('breach_type', e.target.value)} className={IC} style={IS}>
          <option value="">No breach type</option>
          {BREACH_TYPES.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} className={IC} style={IS}>
          <option value="active">Active</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="closed">Closed (not enforced)</option>
        </select>
      </div>
      <select value={form.conviction_status} onChange={e => set('conviction_status', e.target.value)} className={IC} style={IS}>
        <option value="">No conviction status</option>
        {CONVICTION_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
      </select>
      <select value={form.plea} onChange={e => set('plea', e.target.value)} className={IC} style={IS}>
        <option value="">No plea recorded</option>
        {PLEA_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
      </select>
      <select value={form.linked_incident_id} onChange={e => set('linked_incident_id', e.target.value)} className={IC} style={IS}>
        <option value="">No linked incident</option>
        {incidents.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
      </select>
      <textarea rows={2} placeholder="Outcome" value={form.outcome} onChange={e => set('outcome', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      <textarea rows={2} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      <input type="url" placeholder="Fact sheet URL (optional)" value={form.fact_sheet_url} onChange={e => set('fact_sheet_url', e.target.value)}
        className={IC} style={IS} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <X size={14} className="inline mr-1" />Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#6366f1' }}>
          Save
        </button>
      </div>
    </div>
  )
}

const CONVICTION_STYLE = {
  convicted:     { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  'not convicted': { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

function ChargeCard({ charge, incidentTitle, docs, canManage, onClick, onEdit, onDelete }) {
  const st = CHARGE_STATUS_STYLE[charge.status] ?? CHARGE_STATUS_STYLE.active
  const br = charge.breach_type ? BREACH_STYLE[charge.breach_type] : null
  const cv = charge.conviction_status ? CONVICTION_STYLE[charge.conviction_status] : null

  return (
    <button onClick={onClick} className="w-full text-left rounded-xl p-4 border hover:border-indigo-500/40 transition-all group"
      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>

      {/* Row 1: number · status · breach | date */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
            {charge.charge_number || '—'}
          </span>
          <span style={{ background: st.bg, color: st.text, padding: '2px 7px', fontSize: 10, borderRadius: 5, fontWeight: 600 }}>
            {charge.status}
          </span>
          {br && (
            <span style={{ background: br.bg, color: br.text, padding: '2px 7px', fontSize: 10, borderRadius: 5, fontWeight: 600 }}>
              {charge.breach_type.toUpperCase()}
            </span>
          )}
        </div>
        {charge.date_of_charge && (
          <time className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            {format(new Date(charge.date_of_charge), 'd MMM yyyy')}
          </time>
        )}
      </div>

      {/* Row 2: conviction badge (only if set) */}
      {cv && (
        <div className="mb-1.5">
          <span style={{ background: cv.bg, color: cv.text, padding: '2px 8px', fontSize: 10, borderRadius: 5, fontWeight: 700 }}>
            {charge.conviction_status.charAt(0).toUpperCase() + charge.conviction_status.slice(1)}
          </span>
        </div>
      )}

      {/* Row 3: notes as description (clipped 2 lines) */}
      {charge.notes && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-1">{charge.notes}</p>
      )}

      {/* Row 4: outcome (muted, 1 line) */}
      {charge.outcome && (
        <p className="text-xs text-slate-600 truncate">{charge.outcome}</p>
      )}
    </button>
  )
}

function ChargeDrawer({ charge, incidentTitle, initialDocs, canManage, canUpload, userId, onClose, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { accessToken, login, isConnected } = useGoogleDrive()
  const st = CHARGE_STATUS_STYLE[charge.status] ?? CHARGE_STATUS_STYLE.active
  const br = charge.breach_type ? BREACH_STYLE[charge.breach_type] : null
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState('supabase')
  const fileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    if (uploadMode === 'drive') {
      if (!isConnected) { login(); setUploading(false); return }
      try {
        const driveFile = await uploadToDrive(file, accessToken)
        const { data } = await supabase.from('documents')
          .insert({ user_id: userId, title: file.name, google_doc_id: driveFile.id, category: 'legal', related_charge_id: charge.id })
          .select().single()
        if (data) setDocs(d => [...d, data])
      } catch (e) {
        console.error('Drive upload failed', e)
      }
    } else {
      const path = `${userId}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
      if (!upErr) {
        const { data } = await supabase.from('documents')
          .insert({ user_id: userId, title: file.name, file_path: path, category: 'legal', related_charge_id: charge.id })
          .select().single()
        if (data) setDocs(d => [...d, data])
      }
    }
    setUploading(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[500px] lg:w-[560px]"
        style={{ background: '#0f1117', borderLeft: '1px solid #2a2d3a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ ...st, padding: '2px 7px', fontSize: 10, borderRadius: 4, fontWeight: 600 }}>{charge.status}</span>
            {br && <span style={{ ...br, padding: '2px 7px', fontSize: 10, borderRadius: 4, fontWeight: 600 }}>{charge.breach_type.toUpperCase()}</span>}
          </div>
          <div className="flex items-center gap-0.5">
            {canManage && (
              <>
                <button onClick={() => { onClose(); onEdit() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => { onClose(); onDelete() }}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 pb-10">
          {/* Charge number */}
          <h1 className="text-2xl font-mono font-bold text-slate-100 mb-1 leading-tight">
            {charge.charge_number || '—'}
          </h1>
          {charge.date_of_charge && (
            <p className="text-xs text-slate-500 mb-5">{format(new Date(charge.date_of_charge), 'd MMMM yyyy')}</p>
          )}

          {/* Meta row */}
          {(charge.plea || charge.conviction_status || incidentTitle) && (
            <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b" style={{ borderColor: '#2a2d3a' }}>
              {charge.plea && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Plea</p>
                  <p className="text-sm text-slate-300 capitalize">{charge.plea}</p>
                </div>
              )}
              {charge.conviction_status && (() => {
                const cv = CONVICTION_STYLE[charge.conviction_status]
                return (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Conviction</p>
                    <span style={{ background: cv?.bg, color: cv?.text, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 700 }}>
                      {charge.conviction_status.charAt(0).toUpperCase() + charge.conviction_status.slice(1)}
                    </span>
                  </div>
                )
              })()}
              {incidentTitle && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Linked Incident</p>
                  <button
                    onClick={() => { onClose(); navigate(`/incidents/${charge.linked_incident_id}`) }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors text-left underline underline-offset-2">
                    {incidentTitle}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Outcome */}
          {charge.outcome && (
            <div className="mb-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Outcome</h3>
              <div className="p-3 rounded-lg border-l-2 border-indigo-500" style={{ background: '#1a1d27' }}>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{charge.outcome}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {charge.notes && (
            <div className="mb-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{charge.notes}</p>
            </div>
          )}

          {/* Fact sheet URL */}
          {charge.fact_sheet_url && (
            <div className="mb-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Fact Sheet Link</h3>
              <a href={charge.fact_sheet_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:border-indigo-500/40 transition-colors group/fs"
                style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
                <FileText size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300 truncate group-hover/fs:text-indigo-300 transition-colors flex-1">{charge.fact_sheet_url}</span>
                <ExternalLink size={11} className="text-slate-600 shrink-0" />
              </a>
            </div>
          )}

          {/* Uploaded Documents */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Documents{docs.length > 0 ? ` · ${docs.length}` : ''}
            </h3>
            {docs.length === 0 && !canUpload && (
              <p className="text-xs text-slate-600">No documents attached.</p>
            )}
            <div className="flex flex-col gap-2">
              {docs.map(d => <DocumentViewer key={d.id} doc={d} />)}
            </div>
            {canUpload && (
              <div className="mt-2 flex flex-col gap-2">
                <input ref={fileRef} type="file" className="hidden" onChange={e => uploadFile(e.target.files?.[0])} />
                {/* Upload mode toggle */}
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#0f1117' }}>
                  {[['supabase', 'Supabase'], ['drive', 'Google Drive']].map(([m, l]) => (
                    <button key={m} onClick={() => setUploadMode(m)}
                      className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${uploadMode === m ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
                      style={uploadMode === m ? { background: '#2a2d3a' } : {}}>
                      {l}
                    </button>
                  ))}
                </div>
                {uploadMode === 'drive' && !isConnected ? (
                  <button onClick={() => login()}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                    style={{ borderColor: '#2a2d3a' }}>
                    <Link2 size={12} /> Connect Google Drive to upload
                  </button>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors disabled:opacity-40"
                    style={{ borderColor: '#2a2d3a' }}>
                    <Upload size={12} />
                    {uploading ? 'Uploading…' : uploadMode === 'drive' ? 'Upload to Google Drive' : 'Upload document'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}



const ORDER_TYPES  = ['AVO', 'ICO', 'CCO']
const ORDER_STATUS = ['active', 'withdrawn', 'expired']

const ORDER_STATUS_STYLE = {
  active:    { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  withdrawn: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  expired:   { bg: 'rgba(100,116,139,0.12)', text: '#64748b' },
}

const ORDER_TYPE_STYLE = {
  AVO: { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  ICO: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  CCO: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
}

const EMPTY_ORDER = { order_type: 'AVO', protecting_who: '', protected_from: '', status: 'active', conditions: '', expiry_date: '', notes: '' }

function OrderForm({ initial = EMPTY_ORDER, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.order_type) { setError('Order type is required.'); return }
    setError('')
    onSave(form)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={form.order_type} onChange={e => set('order_type', e.target.value)} className={IC} style={IS}>
          {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} className={IC} style={IS}>
          {ORDER_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <input placeholder="Protecting who" value={form.protecting_who} onChange={e => set('protecting_who', e.target.value)}
        className={IC} style={IS} />
      <input placeholder="Protected from (defendant)" value={form.protected_from} onChange={e => set('protected_from', e.target.value)}
        className={IC} style={IS} />
      <textarea rows={3} placeholder="Conditions" value={form.conditions} onChange={e => set('conditions', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Expiry date</label>
          <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}
            className={IC} style={{ ...IS, colorScheme: 'dark' }} />
        </div>
        <div />
      </div>
      <textarea rows={2} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <X size={14} className="inline mr-1" />Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#6366f1' }}>
          Save
        </button>
      </div>
    </div>
  )
}

function OrderCard({ order, canManage, onClick, onEdit, onDelete }) {
  const st = ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.active
  const ot = ORDER_TYPE_STYLE[order.order_type] ?? {}
  const daysLeft = order.expiry_date ? differenceInDays(new Date(order.expiry_date), new Date()) : null
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

  return (
    <button onClick={onClick} className="w-full text-left rounded-xl p-4 border hover:border-indigo-500/40 transition-all group"
      style={{ background: '#1a1d27', borderColor: expiringSoon ? 'rgba(249,115,22,0.4)' : '#2a2d3a' }}>

      {/* Row 1: type · status | expiry */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span style={{ background: ot.bg, color: ot.text, padding: '2px 7px', fontSize: 10, borderRadius: 5, fontWeight: 700 }}>
            {order.order_type}
          </span>
          <span style={{ background: st.bg, color: st.text, padding: '2px 7px', fontSize: 10, borderRadius: 5, fontWeight: 600 }}>
            {order.status}
          </span>
        </div>
        {order.expiry_date && (
          <time className={`text-xs whitespace-nowrap shrink-0 ${expiringSoon ? 'text-orange-400' : 'text-slate-500'}`}>
            {format(new Date(order.expiry_date), 'd MMM yyyy')}
            {expiringSoon && daysLeft > 0 && ` · ${daysLeft}d`}
            {daysLeft === 0 && ' · today'}
          </time>
        )}
      </div>

      {/* Row 2: who vs who as title */}
      <p className="font-semibold text-slate-100 text-sm leading-snug mb-1.5 group-hover:text-indigo-300 transition-colors">
        {[order.protecting_who, order.protected_from].filter(Boolean).join(' vs ') || '—'}
      </p>

      {/* Row 3: conditions clipped */}
      {order.conditions && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{order.conditions}</p>
      )}
    </button>
  )
}

function OrderDrawer({ order, canManage, onClose, onEdit, onDelete }) {
  const st = ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.active
  const ot = ORDER_TYPE_STYLE[order.order_type] ?? {}
  const daysLeft = order.expiry_date ? differenceInDays(new Date(order.expiry_date), new Date()) : null
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[500px] lg:w-[560px]"
        style={{ background: '#0f1117', borderLeft: '1px solid #2a2d3a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ ...ot, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 700 }}>{order.order_type}</span>
            <span style={{ ...st, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 600 }}>{order.status}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {canManage && (
              <>
                <button onClick={() => { onClose(); onEdit() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => { onClose(); onDelete() }}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 pb-10">
          {/* Who vs who */}
          {(order.protecting_who || order.protected_from) && (
            <div className="mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                {order.protecting_who && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Protected</p>
                    <p className="text-xl font-bold text-slate-100">{order.protecting_who}</p>
                  </div>
                )}
                {order.protecting_who && order.protected_from && (
                  <span className="text-slate-600 text-lg font-light mt-4">vs</span>
                )}
                {order.protected_from && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Defendant</p>
                    <p className="text-xl font-bold text-slate-100">{order.protected_from}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expiry */}
          {order.expiry_date && (
            <div className="flex items-center gap-2 mb-5 pb-5 border-b" style={{ borderColor: '#2a2d3a' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Expiry Date</p>
                <p className={`text-sm font-medium ${expiringSoon ? 'text-orange-400' : 'text-slate-300'}`}>
                  {format(new Date(order.expiry_date), 'd MMMM yyyy')}
                </p>
              </div>
              {expiringSoon && daysLeft > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ml-2"
                  style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}>
                  <AlertCircle size={9} />{daysLeft}d remaining
                </span>
              )}
              {daysLeft === 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ml-2"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                  Expires today
                </span>
              )}
            </div>
          )}

          {/* Conditions */}
          {order.conditions && (
            <div className="mb-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Conditions</h3>
              <div className="p-3 rounded-lg border-l-2 border-indigo-500" style={{ background: '#1a1d27' }}>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{order.conditions}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</h3>
              <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ChargesAVO() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const [tab, setTab] = useState('charges')

  // Charges state
  const [charges, setCharges] = useState([])
  const [chargeDocs, setChargeDocs] = useState({})
  const [incidents, setIncidents] = useState([])
  const [chargesLoading, setChargesLoading] = useState(true)
  const [showChargeForm, setShowChargeForm] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState(null)
  const [editingCharge, setEditingCharge] = useState(null)
  const [confirmDeleteCharge, setConfirmDeleteCharge] = useState(null)
  const [chargeSearch, setChargeSearch] = useState('')

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState(null)
  const [orderSearch, setOrderSearch] = useState('')

  useEffect(() => {
    if (!user) return
    // Load charges + related docs
    Promise.all([
      supabase.from('charges').select('*').order('created_at', { ascending: false }),
      supabase.from('documents').select('*').not('related_charge_id', 'is', null),
      supabase.from('incidents').select('id, title').order('date', { ascending: false }),
    ]).then(([cRes, dRes, iRes]) => {
      setCharges(cRes.data ?? [])
      const docMap = {}
      ;(dRes.data ?? []).forEach(d => {
        if (!docMap[d.related_charge_id]) docMap[d.related_charge_id] = []
        docMap[d.related_charge_id].push(d)
      })
      setChargeDocs(docMap)
      setIncidents(iRes.data ?? [])
      setChargesLoading(false)
    })

    // Load orders
    supabase.from('court_orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setOrdersLoading(false) })
  }, [user])

  // ─── Charges CRUD ───
  const saveCharge = async (form) => {
    const payload = {
      charge_number:      form.charge_number || null,
      date_of_charge:     form.date_of_charge || null,
      breach_type:        form.breach_type || null,
      linked_incident_id: form.linked_incident_id || null,
      plea:               form.plea || null,
      outcome:            form.outcome || null,
      status:             form.status,
      conviction_status:  form.conviction_status || null,
      notes:              form.notes || null,
      fact_sheet_url:     form.fact_sheet_url || null,
    }
    if (editingCharge) {
      const { data } = await supabase.from('charges').update(payload).eq('id', editingCharge.id).select().single()
      if (data) setCharges(c => c.map(x => x.id === data.id ? data : x))
      setEditingCharge(null)
    } else {
      const { data } = await supabase.from('charges').insert({ ...payload, user_id: user.id }).select().single()
      if (data) setCharges(c => [data, ...c])
      setShowChargeForm(false)
    }
  }

  const deleteCharge = async () => {
    if (!confirmDeleteCharge) return
    await supabase.from('charges').delete().eq('id', confirmDeleteCharge)
    setCharges(c => c.filter(x => x.id !== confirmDeleteCharge))
    setConfirmDeleteCharge(null)
  }

  // ─── Orders CRUD ───
  const saveOrder = async (form) => {
    const payload = {
      order_type:     form.order_type,
      protecting_who: form.protecting_who || null,
      protected_from: form.protected_from || null,
      status:         form.status,
      conditions:     form.conditions || null,
      expiry_date:    form.expiry_date || null,
      notes:          form.notes || null,
    }
    if (editingOrder) {
      const { data } = await supabase.from('court_orders').update(payload).eq('id', editingOrder.id).select().single()
      if (data) setOrders(o => o.map(x => x.id === data.id ? data : x))
      setEditingOrder(null)
    } else {
      const { data } = await supabase.from('court_orders').insert({ ...payload, user_id: user.id }).select().single()
      if (data) setOrders(o => [data, ...o])
      setShowOrderForm(false)
    }
  }

  const deleteOrder = async () => {
    if (!confirmDeleteOrder) return
    await supabase.from('court_orders').delete().eq('id', confirmDeleteOrder)
    setOrders(o => o.filter(x => x.id !== confirmDeleteOrder))
    setConfirmDeleteOrder(null)
  }

  // ─── Filtered lists ───
  const incidentMap = Object.fromEntries(incidents.map(i => [i.id, i.title]))

  const filteredCharges = charges.filter(c => {
    if (!chargeSearch.trim()) return true
    const q = chargeSearch.toLowerCase()
    return (
      c.charge_number?.toLowerCase().includes(q) ||
      c.outcome?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q) ||
      c.breach_type?.toLowerCase().includes(q) ||
      incidentMap[c.linked_incident_id]?.toLowerCase().includes(q)
    )
  })

  const filteredOrders = orders.filter(o => {
    if (!orderSearch.trim()) return true
    const q = orderSearch.toLowerCase()
    return (
      o.protecting_who?.toLowerCase().includes(q) ||
      o.protected_from?.toLowerCase().includes(q) ||
      o.conditions?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q) ||
      o.order_type?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Charges / AVO</h1>
        {can.manageCases && (
          <button
            onClick={() => tab === 'charges' ? setShowChargeForm(true) : setShowOrderForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#6366f1' }}>
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: '#1a1d27' }}>
        {[{ id: 'charges', label: 'Charges' }, { id: 'orders', label: 'Court Orders (AVO / ICO / CCO)' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            style={tab === t.id ? { background: '#2a2d3a' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── CHARGES TAB ─── */}
      {tab === 'charges' && (
        <>
          {/* New charge form */}
          {showChargeForm && (
            <div className="rounded-xl border p-4 mb-3" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">New Charge</h3>
              <ChargeForm incidents={incidents} onSave={saveCharge} onCancel={() => setShowChargeForm(false)} />
            </div>
          )}

          {/* Search */}
          {charges.length > 0 && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
              <input type="text" placeholder="Search charges…" value={chargeSearch} onChange={e => setChargeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
                style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
            </div>
          )}

          {chargesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCharges.length === 0 ? (
            <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">
                {charges.length === 0 ? 'No charges recorded yet.' : 'No charges match your search.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 mb-1">{filteredCharges.length} charge{filteredCharges.length !== 1 ? 's' : ''}</p>
              {filteredCharges.map(c => (
                editingCharge?.id === c.id ? (
                  <div key={c.id} className="rounded-xl border p-4" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Edit Charge</h3>
                    <ChargeForm initial={c} incidents={incidents} onSave={saveCharge} onCancel={() => setEditingCharge(null)} />
                  </div>
                ) : (
                  <ChargeCard
                    key={c.id}
                    charge={c}
                    incidentTitle={incidentMap[c.linked_incident_id]}
                    docs={chargeDocs[c.id] ?? []}
                    canManage={can.manageCases}
                    onClick={() => setSelectedCharge(c)}
                    onEdit={() => setEditingCharge(c)}
                    onDelete={() => setConfirmDeleteCharge(c.id)}
                  />
                )
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── ORDERS TAB ─── */}
      {tab === 'orders' && (
        <>
          {/* New order form */}
          {showOrderForm && (
            <div className="rounded-xl border p-4 mb-3" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">New Court Order</h3>
              <OrderForm onSave={saveOrder} onCancel={() => setShowOrderForm(false)} />
            </div>
          )}

          {/* Search */}
          {orders.length > 0 && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
              <input type="text" placeholder="Search orders…" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
                style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
            </div>
          )}

          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">
                {orders.length === 0 ? 'No court orders recorded yet.' : 'No orders match your search.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 mb-1">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
              {filteredOrders.map(o => (
                editingOrder?.id === o.id ? (
                  <div key={o.id} className="rounded-xl border p-4" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Edit Court Order</h3>
                    <OrderForm initial={o} onSave={saveOrder} onCancel={() => setEditingOrder(null)} />
                  </div>
                ) : (
                  <OrderCard
                    key={o.id}
                    order={o}
                    canManage={can.manageCases}
                    onClick={() => setSelectedOrder(o)}
                    onEdit={() => setEditingOrder(o)}
                    onDelete={() => setConfirmDeleteOrder(o.id)}
                  />
                )
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirmDeleteCharge}
        title="Delete Charge"
        message="This will permanently delete this charge record."
        confirmLabel="Delete"
        onConfirm={deleteCharge}
        onCancel={() => setConfirmDeleteCharge(null)}
      />
      <ConfirmDialog
        open={!!confirmDeleteOrder}
        title="Delete Court Order"
        message="This will permanently delete this court order."
        confirmLabel="Delete"
        onConfirm={deleteOrder}
        onCancel={() => setConfirmDeleteOrder(null)}
      />

      {selectedCharge && (
        <ChargeDrawer
          charge={selectedCharge}
          incidentTitle={incidentMap[selectedCharge.linked_incident_id]}
          initialDocs={chargeDocs[selectedCharge.id] ?? []}
          canManage={can.manageCases}
          canUpload={can.upload}
          userId={user?.id}
          onClose={() => setSelectedCharge(null)}
          onEdit={() => { setSelectedCharge(null); setEditingCharge(selectedCharge) }}
          onDelete={() => { setSelectedCharge(null); setConfirmDeleteCharge(selectedCharge.id) }}
        />
      )}

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          canManage={can.manageCases}
          onClose={() => setSelectedOrder(null)}
          onEdit={() => { setSelectedOrder(null); setEditingOrder(selectedOrder) }}
          onDelete={() => { setSelectedOrder(null); setConfirmDeleteOrder(selectedOrder.id) }}
        />
      )}
    </div>
  )
}
