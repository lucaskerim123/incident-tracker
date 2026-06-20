import { useEffect, useState, useRef } from 'react'
import { Upload, X, FileText, Search, Download, Lock, Pencil, Trash2, Plus, Briefcase, Hash, ExternalLink, Check } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const IC = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const IS = { background: '#0f1117', borderColor: '#2a2d3a' }

const DOC_CATS = ['legal', 'court', 'avo', 'mental_health', 'police', 'personal', 'other']
const fmtCat = s => s === 'avo' ? 'AVO' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const BLANK_FORM = { title: '', description: '', category: 'legal', related_case_id: '', related_incident_id: '', restricted: false, google_doc_id: '' }

function DocCard({ doc, caseLabel, incidentLabel, onEdit, onDelete, canEdit, canDelete }) {
  const openDoc = async () => {
    if (doc.file_path) {
      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } else if (doc.google_doc_id) {
      window.open(`https://docs.google.com/document/d/${doc.google_doc_id}/edit`, '_blank')
    }
  }
  const isPdf = doc.file_path?.toLowerCase().endsWith('.pdf')
  const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.file_path ?? '')
  const isGdrive = !!doc.google_doc_id

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#1a1d27', borderColor: doc.restricted ? 'rgba(251,191,36,0.2)' : '#2a2d3a' }}>
      <div className="p-3 flex items-start gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors" onClick={openDoc}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(99,102,241,0.15)' }}>
          <FileText size={17} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium text-slate-100 truncate leading-snug">{doc.title}</p>
            {doc.restricted && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                <Lock size={9} /> Hidden
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {isGdrive ? 'Google Drive' : isPdf ? 'PDF' : isImg ? 'Image' : 'File'}
            {doc.category && ` · ${fmtCat(doc.category)}`}
          </p>
          {(caseLabel || incidentLabel) && (
            <div className="flex flex-wrap gap-x-3 mt-1">
              {caseLabel && (
                <span className="flex items-center gap-1 text-xs text-indigo-400/70">
                  <Briefcase size={10} />{caseLabel}
                </span>
              )}
              {incidentLabel && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Hash size={10} />{incidentLabel}
                </span>
              )}
            </div>
          )}
          {doc.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-1">{doc.description}</p>
          )}
        </div>
        {isGdrive
          ? <ExternalLink size={13} className="text-slate-600 shrink-0 mt-1.5" />
          : <Download size={13} className="text-slate-600 shrink-0 mt-1.5" />
        }
      </div>
      {(canEdit || canDelete) && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t" style={{ borderColor: '#0f1117' }}>
          <span className="text-[11px] text-slate-700">{format(new Date(doc.created_at), 'd MMM yyyy')}</span>
          <div className="flex gap-0.5">
            {canEdit && (
              <button onClick={onEdit} className="p-1.5 rounded text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Pencil size={12} />
              </button>
            )}
            {canDelete && (
              <button onClick={onDelete} className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DocEditForm({ doc, cases, incidents, onSave, onCancel, canRestrict }) {
  const [form, setForm] = useState({
    title: doc.title,
    description: doc.description ?? '',
    category: doc.category,
    related_case_id: doc.related_case_id ?? '',
    related_incident_id: doc.related_incident_id ?? '',
    restricted: doc.restricted ?? false,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-100">Edit Document</p>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X size={15} /></button>
      </div>
      <div className="flex flex-col gap-2">
        <input placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} className={IC} style={IS} />
        <textarea rows={2} placeholder="Description (optional)" value={form.description}
          onChange={e => set('description', e.target.value)} className={`${IC} resize-none`} style={IS} />
        <div className="grid grid-cols-2 gap-2">
          <select value={form.category} onChange={e => set('category', e.target.value)} className={IC} style={IS}>
            {DOC_CATS.map(c => <option key={c} value={c}>{fmtCat(c)}</option>)}
          </select>
          <select value={form.related_case_id} onChange={e => set('related_case_id', e.target.value)} className={IC} style={IS}>
            <option value="">No linked case</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.charge || c.case_number || c.id.slice(0, 8)}</option>)}
          </select>
        </div>
        <select value={form.related_incident_id} onChange={e => set('related_incident_id', e.target.value)} className={IC} style={IS}>
          <option value="">No linked incident</option>
          {incidents.map(i => <option key={i.id} value={i.id}>{format(new Date(i.date), 'd MMM yyyy')} — {i.title}</option>)}
        </select>
        {canRestrict && (
          <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
            <input type="checkbox" checked={form.restricted} onChange={e => set('restricted', e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-400" />
            <Lock size={11} className="text-amber-400" />
            <span className="text-xs text-slate-400">Hidden from viewers</span>
          </label>
        )}
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.title.trim()}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#6366f1' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

function AddPanel({ cases, incidents, canRestrict, onAdded, onClose }) {
  const { user } = useAuth()
  const [mode, setMode] = useState('upload')
  const [form, setForm] = useState(BLANK_FORM)
  const [stagedFiles, setStagedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [error, setError] = useState('')
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onFilesPicked = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setStagedFiles(files)
    setError('')
    e.target.value = ''
  }

  const uploadAll = async () => {
    if (!stagedFiles.length) return
    setUploading(true); setError('')
    const results = []
    for (const file of stagedFiles) {
      setUploadProgress(p => ({ ...p, [file.name]: 'uploading' }))
      const path = `${user.id}/${Date.now()}_${file.name}`
      const { error: storageErr } = await supabase.storage.from('documents').upload(path, file)
      if (storageErr) {
        setUploadProgress(p => ({ ...p, [file.name]: 'error' }))
        setError(`Failed to upload ${file.name}: ${storageErr.message}`)
        continue
      }
      const { data } = await supabase.from('documents').insert({
        user_id: user.id,
        title: file.name,
        file_path: path,
        category: form.category,
        related_case_id: form.related_case_id || null,
        related_incident_id: form.related_incident_id || null,
        restricted: form.restricted,
        description: form.description || null,
        created_at: new Date().toISOString(),
      }).select().single()
      if (data) results.push(data)
      setUploadProgress(p => ({ ...p, [file.name]: 'done' }))
    }
    setUploading(false)
    if (results.length) { onAdded(results); onClose() }
  }

  const addGdrive = async () => {
    if (!form.title.trim() || !form.google_doc_id.trim()) { setError('Title and Google Doc ID are required.'); return }
    const { data, error: insertErr } = await supabase.from('documents').insert({
      user_id: user.id,
      title: form.title,
      google_doc_id: form.google_doc_id,
      category: form.category,
      related_case_id: form.related_case_id || null,
      related_incident_id: form.related_incident_id || null,
      restricted: form.restricted,
      description: form.description || null,
      created_at: new Date().toISOString(),
    }).select().single()
    if (insertErr) { setError(insertErr.message); return }
    if (data) { onAdded([data]); onClose() }
  }

  const sharedFields = (
    <>
      <textarea rows={2} placeholder="Description (optional)" value={form.description}
        onChange={e => set('description', e.target.value)} className={`${IC} resize-none`} style={IS} />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.category} onChange={e => set('category', e.target.value)} className={IC} style={IS}>
          {DOC_CATS.map(c => <option key={c} value={c}>{fmtCat(c)}</option>)}
        </select>
        <select value={form.related_case_id} onChange={e => set('related_case_id', e.target.value)} className={IC} style={IS}>
          <option value="">No linked case</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.charge || c.case_number || c.id.slice(0, 8)}</option>)}
        </select>
      </div>
      <select value={form.related_incident_id} onChange={e => set('related_incident_id', e.target.value)} className={IC} style={IS}>
        <option value="">No linked incident</option>
        {incidents.map(i => <option key={i.id} value={i.id}>{format(new Date(i.date), 'd MMM yyyy')} — {i.title}</option>)}
      </select>
      {canRestrict && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.restricted} onChange={e => set('restricted', e.target.checked)}
            className="w-3.5 h-3.5 accent-amber-400" />
          <Lock size={11} className="text-amber-400" />
          <span className="text-xs text-slate-400">Hidden from viewers</span>
        </label>
      )}
    </>
  )

  return (
    <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: '#0f1117' }}>
          {[['upload', 'Upload Files'], ['gdrive', 'Google Drive']].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${mode === m ? 'text-slate-100' : 'text-slate-500'}`}
              style={mode === m ? { background: '#2a2d3a' } : {}}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
      </div>

      {mode === 'upload' ? (
        <div className="flex flex-col gap-2">
          <input type="file" ref={fileRef} onChange={onFilesPicked} className="hidden" multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.csv" />

          {stagedFiles.length === 0 ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 text-slate-400 hover:text-slate-200 hover:border-indigo-500/50 transition-colors"
              style={{ borderColor: '#2a2d3a' }}>
              <Upload size={24} />
              <span className="text-sm">Click to select files</span>
              <span className="text-xs text-slate-600">PDF, DOC, DOCX, images, spreadsheets — multiple allowed</span>
            </button>
          ) : (
            <div className="rounded-lg border p-2 flex flex-col gap-1" style={{ borderColor: '#2a2d3a' }}>
              {stagedFiles.map(f => (
                <div key={f.name} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                  style={{ background: '#0f1117' }}>
                  <FileText size={12} className="text-slate-500 shrink-0" />
                  <span className="flex-1 text-slate-300 truncate">{f.name}</span>
                  <span className="text-slate-600 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                  {uploadProgress[f.name] === 'done' && <Check size={12} className="text-emerald-400 shrink-0" />}
                  {uploadProgress[f.name] === 'error' && <span className="text-red-400 shrink-0">✕</span>}
                  {uploadProgress[f.name] === 'uploading' && (
                    <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </div>
              ))}
              <button onClick={() => { setStagedFiles([]); setUploadProgress({}) }}
                className="text-xs text-slate-600 hover:text-slate-400 mt-1 text-left">
                Clear selection
              </button>
            </div>
          )}

          {sharedFields}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 justify-end mt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
            <button onClick={stagedFiles.length ? uploadAll : () => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#6366f1' }}>
              <Upload size={14} />
              {uploading ? 'Uploading…' : stagedFiles.length ? `Upload ${stagedFiles.length} file${stagedFiles.length > 1 ? 's' : ''}` : 'Choose Files'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input placeholder="Document title *" value={form.title}
            onChange={e => set('title', e.target.value)} className={IC} style={IS} />
          <input placeholder="Google Doc ID (from the URL) *" value={form.google_doc_id}
            onChange={e => set('google_doc_id', e.target.value)} className={IC} style={IS} />
          <p className="text-xs text-slate-600 -mt-1">Paste the long ID found in the Google Docs URL</p>
          {sharedFields}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end mt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-400">Cancel</button>
            <button onClick={addGdrive}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#6366f1' }}>Add Link</button>
          </div>
        </div>
      )}
    </div>
  )
}

function GroupSection({ label, docs, caseMap, incidentMap, onEdit, onDelete, canEdit, canDelete, editingId, editComp }) {
  const [open, setOpen] = useState(true)
  if (!docs.length) return null
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 mb-2 group w-full text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-300 transition-colors">
          {label}
        </span>
        <span className="text-[11px] text-slate-700 font-mono">· {docs.length}</span>
        <span className="text-slate-700 text-xs ml-auto">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {docs.map(doc =>
            editingId === doc.id ? editComp(doc) : (
              <DocCard
                key={doc.id}
                doc={doc}
                caseLabel={caseMap[doc.related_case_id]}
                incidentLabel={incidentMap[doc.related_incident_id]}
                onEdit={() => onEdit(doc)}
                onDelete={() => onDelete(doc)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function Documents() {
  const { user } = useAuth()
  const { can, role } = usePermissions()
  const canRestrict = role === 'editor' || role === 'admin'

  const [docs, setDocs] = useState([])
  const [cases, setCases] = useState([])
  const [incidents, setIncidents] = useState([])
  const [charges, setCharges] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [tab, setTab] = useState('all')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('cases').select('id, charge, case_number').order('court_date', { nullsFirst: false }),
      supabase.from('incidents').select('id, title, date').order('date', { ascending: false }),
      supabase.from('charges').select('id, charge_number, breach_type, status').order('created_at', { ascending: false }),
      supabase.from('court_orders').select('id, order_type, protecting_who, protected_from, status').order('created_at', { ascending: false }),
    ]).then(([docsRes, casesRes, incRes, chargesRes, ordersRes]) => {
      setDocs(docsRes.data ?? [])
      setCases(casesRes.data ?? [])
      setIncidents(incRes.data ?? [])
      setCharges(chargesRes.data ?? [])
      setOrders(ordersRes.data ?? [])
      setLoading(false)
    })
  }, [user])

  const caseMap = Object.fromEntries(cases.map(c => [c.id, c.charge || c.case_number || c.id.slice(0, 8)]))
  const incidentMap = Object.fromEntries(incidents.map(i => [i.id, i.title]))
  const chargeMap = Object.fromEntries(charges.map(c => [c.id, `${c.charge_number || '—'}${c.breach_type ? ` · ${c.breach_type.toUpperCase()}` : ''}`]))
  const orderMap = Object.fromEntries(orders.map(o => [o.id, `${o.order_type} · ${[o.protecting_who, o.protected_from].filter(Boolean).join(' vs ') || '—'}`]))

  const handleAdded = (newDocs) => setDocs(d => [...newDocs, ...d])

  const saveEdit = async (form) => {
    const { data, error: updateErr } = await supabase.from('documents')
      .update({
        title: form.title,
        description: form.description || null,
        category: form.category,
        related_case_id: form.related_case_id || null,
        related_incident_id: form.related_incident_id || null,
        restricted: form.restricted,
      })
      .eq('id', editingDoc.id)
      .select().single()
    if (updateErr) { setError(updateErr.message); return }
    if (data) setDocs(d => d.map(x => x.id === editingDoc.id ? data : x))
    setEditingDoc(null)
  }

  const deleteDoc = async (doc) => {
    if (doc.file_path) await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocs(d => d.filter(x => x.id !== doc.id))
    setConfirmDel(null)
  }

  const exportCsv = async () => {
    setExportLoading(true)
    const headers = ['title', 'category', 'description', 'linked_case', 'linked_incident', 'restricted', 'type', 'added']
    const rows = docs.map(d => [
      d.title,
      fmtCat(d.category),
      d.description ?? '',
      caseMap[d.related_case_id] ?? '',
      incidentMap[d.related_incident_id] ?? '',
      d.restricted ? 'yes' : 'no',
      d.google_doc_id ? 'Google Drive' : 'File',
      format(new Date(d.created_at), 'd MMM yyyy'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `documents_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    setExportLoading(false)
  }

  const q = search.toLowerCase().trim()
  const filtered = docs.filter(d => {
    if (catFilter !== 'all' && d.category !== catFilter) return false
    if (q && !d.title?.toLowerCase().includes(q) && !d.description?.toLowerCase().includes(q)) return false
    return true
  })

  const editComp = (doc) => (
    <DocEditForm
      key={`edit-${doc.id}`}
      doc={doc}
      cases={cases}
      incidents={incidents}
      onSave={saveEdit}
      onCancel={() => setEditingDoc(null)}
      canRestrict={canRestrict}
    />
  )

  const renderAllList = () => {
    if (!filtered.length) return (
      <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <p className="text-slate-400 text-sm">{docs.length === 0 ? 'No documents added yet.' : 'No documents match.'}</p>
      </div>
    )
    return (
      <div className="flex flex-col gap-2">
        {filtered.map(doc =>
          editingDoc?.id === doc.id ? editComp(doc) : (
            <DocCard
              key={doc.id}
              doc={doc}
              caseLabel={caseMap[doc.related_case_id]}
              incidentLabel={incidentMap[doc.related_incident_id]}
              onEdit={() => setEditingDoc(doc)}
              onDelete={() => setConfirmDel(doc)}
              canEdit={can.upload}
              canDelete={can.delete}
            />
          )
        )}
      </div>
    )
  }

  const renderCasesView = () => {
    const linked = filtered.filter(d => d.related_case_id)
    const unlinked = filtered.filter(d => !d.related_case_id)
    const byCaseId = {}
    linked.forEach(d => {
      if (!byCaseId[d.related_case_id]) byCaseId[d.related_case_id] = []
      byCaseId[d.related_case_id].push(d)
    })
    const props = { caseMap, incidentMap, onEdit: setEditingDoc, onDelete: setConfirmDel, canEdit: can.upload, canDelete: can.delete, editingId: editingDoc?.id, editComp }
    return (
      <>
        {cases.filter(c => byCaseId[c.id]).map(c => (
          <GroupSection key={c.id} label={c.charge || c.case_number || 'Unnamed Case'} docs={byCaseId[c.id] ?? []} {...props} />
        ))}
        {unlinked.length > 0 && <GroupSection label="Not linked to a case" docs={unlinked} {...props} />}
        {!filtered.length && (
          <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
            <p className="text-slate-400 text-sm">No documents match.</p>
          </div>
        )}
      </>
    )
  }

  const renderChargesView = () => {
    const linked = filtered.filter(d => d.related_charge_id)
    const unlinked = filtered.filter(d => !d.related_charge_id && !d.related_order_id)
    const byChargeId = {}
    linked.forEach(d => {
      if (!byChargeId[d.related_charge_id]) byChargeId[d.related_charge_id] = []
      byChargeId[d.related_charge_id].push(d)
    })
    const props = { caseMap, incidentMap, onEdit: setEditingDoc, onDelete: setConfirmDel, canEdit: can.upload, canDelete: can.delete, editingId: editingDoc?.id, editComp }
    return (
      <>
        {charges.filter(c => byChargeId[c.id]).map(c => (
          <GroupSection key={c.id} label={chargeMap[c.id]} docs={byChargeId[c.id] ?? []} {...props} />
        ))}
        {unlinked.length > 0 && <GroupSection label="Not linked to a charge" docs={unlinked} {...props} />}
        {!filtered.length && (
          <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
            <p className="text-slate-400 text-sm">No documents match.</p>
          </div>
        )}
      </>
    )
  }

  const renderOrdersView = () => {
    const linked = filtered.filter(d => d.related_order_id)
    const unlinked = filtered.filter(d => !d.related_order_id && !d.related_charge_id)
    const byOrderId = {}
    linked.forEach(d => {
      if (!byOrderId[d.related_order_id]) byOrderId[d.related_order_id] = []
      byOrderId[d.related_order_id].push(d)
    })
    const props = { caseMap, incidentMap, onEdit: setEditingDoc, onDelete: setConfirmDel, canEdit: can.upload, canDelete: can.delete, editingId: editingDoc?.id, editComp }
    return (
      <>
        {orders.filter(o => byOrderId[o.id]).map(o => (
          <GroupSection key={o.id} label={orderMap[o.id]} docs={byOrderId[o.id] ?? []} {...props} />
        ))}
        {unlinked.length > 0 && <GroupSection label="Not linked to an order" docs={unlinked} {...props} />}
        {!filtered.length && (
          <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
            <p className="text-slate-400 text-sm">No documents match.</p>
          </div>
        )}
      </>
    )
  }

  const renderIncidentsView = () => {
    const linked = filtered.filter(d => d.related_incident_id)
    const unlinked = filtered.filter(d => !d.related_incident_id)
    const byIncidentId = {}
    linked.forEach(d => {
      if (!byIncidentId[d.related_incident_id]) byIncidentId[d.related_incident_id] = []
      byIncidentId[d.related_incident_id].push(d)
    })
    const props = { caseMap, incidentMap, onEdit: setEditingDoc, onDelete: setConfirmDel, canEdit: can.upload, canDelete: can.delete, editingId: editingDoc?.id, editComp }
    return (
      <>
        {incidents.filter(i => byIncidentId[i.id]).map(i => (
          <GroupSection key={i.id} label={i.title} docs={byIncidentId[i.id] ?? []} {...props} />
        ))}
        {unlinked.length > 0 && <GroupSection label="Not linked to an incident" docs={unlinked} {...props} />}
        {!filtered.length && (
          <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
            <p className="text-slate-400 text-sm">No documents match.</p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Documents</h1>
        <div className="flex gap-2">
          {docs.length > 0 && (
            <button onClick={exportCsv} disabled={exportLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 border hover:border-indigo-500/30 transition-colors disabled:opacity-50"
              style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <Download size={14} className="text-indigo-400" />
              Export
            </button>
          )}
          {can.upload && (
            <button onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#6366f1' }}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>
      </div>

      {showAdd && can.upload && (
        <AddPanel
          cases={cases}
          incidents={incidents}
          canRestrict={canRestrict}
          onAdded={handleAdded}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input type="text" placeholder="Search documents…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
      </div>

      {/* Library tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {[['all', 'All'], ['cases', 'By Case'], ['incidents', 'By Incident'], ['charges', 'By Charge'], ['orders', 'By Order']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === key ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            style={tab === key ? { background: '#6366f1' } : { background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {['all', ...DOC_CATS].map(f => (
          <button key={f} onClick={() => setCatFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${catFilter === f ? 'text-white' : 'text-slate-500'}`}
            style={catFilter === f ? { background: '#3730a3' } : { background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            {f === 'all' ? 'All categories' : fmtCat(f)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg text-xs text-red-300 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'all' ? renderAllList()
        : tab === 'cases' ? renderCasesView()
        : tab === 'incidents' ? renderIncidentsView()
        : tab === 'charges' ? renderChargesView()
        : renderOrdersView()
      }

      <ConfirmDialog open={!!confirmDel} title="Delete Document"
        message={`Delete "${confirmDel?.title}"? This cannot be undone.`}
        confirmLabel="Delete" onConfirm={() => deleteDoc(confirmDel)} onCancel={() => setConfirmDel(null)} />
    </div>
  )
}
