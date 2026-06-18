import { useEffect, useState, useRef } from 'react'
import { Upload, Link2, Trash2, X, FileText, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'
import DocumentViewer from '../components/DocumentViewer'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

const DOC_CATEGORIES = ['legal', 'court', 'avo', 'mental_health', 'police', 'personal', 'other']
const fmtCat = (s) => s === 'avo' ? 'AVO' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function Documents() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState('upload') // 'upload' | 'gdrive'
  const [gdriveForm, setGdriveForm] = useState({ title: '', google_doc_id: '', category: 'legal', related_incident_id: '' })
  const [confirmDel, setConfirmDel] = useState(null)
  const [filter, setFilter] = useState('all')
  const [uploadError, setUploadError] = useState('')
  const [incidents, setIncidents] = useState([])
  const [uploadIncidentId, setUploadIncidentId] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (!user) return
    supabase.from('documents').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setDocs(data ?? []); setLoading(false) })
  }, [user])

  useEffect(() => {
    if (!showAdd || !user) return
    supabase.from('incidents').select('id, title, date').order('date', { ascending: false })
      .then(({ data }) => setIncidents(data ?? []))
  }, [showAdd, user])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadError('')
    const path = `${user.id}/${Date.now()}_${file.name}`
    const { error: storageErr } = await supabase.storage.from('documents').upload(path, file)
    if (storageErr) { setUploadError(storageErr.message); setUploading(false); return }
    const { data } = await supabase.from('documents').insert({
      user_id: user.id, title: file.name, file_path: path, category: 'other',
      related_incident_id: uploadIncidentId || null, created_at: new Date().toISOString(),
    }).select().single()
    if (data) setDocs(d => [data, ...d])
    setUploading(false)
    setUploadIncidentId('')
    e.target.value = ''
  }

  const addGdriveDoc = async () => {
    if (!gdriveForm.title.trim() || !gdriveForm.google_doc_id.trim()) return
    const { data } = await supabase.from('documents').insert({
      user_id: user.id, ...gdriveForm,
      related_incident_id: gdriveForm.related_incident_id || null,
      created_at: new Date().toISOString(),
    }).select().single()
    if (data) { setDocs(d => [data, ...d]); setShowAdd(false); setGdriveForm({ title: '', google_doc_id: '', category: 'legal', related_incident_id: '' }) }
  }

  const deleteDoc = async (doc) => {
    if (doc.file_path) await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocs(d => d.filter(x => x.id !== doc.id))
    setConfirmDel(null)
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.category === filter)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Documents</h1>
        {can.upload && (
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#6366f1' }}>
            <Upload size={16} /> Add
          </button>
        )}
      </div>

      {showAdd && can.upload && (
        <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
          <div className="flex justify-between mb-3">
            <div className="flex rounded-lg p-0.5" style={{ background: '#0f1117' }}>
              {[['upload', 'Upload File'], ['gdrive', 'Google Drive']].map(([m, l]) => (
                <button key={m} onClick={() => setAddMode(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${addMode === m ? 'text-slate-100' : 'text-slate-500'}`}
                  style={addMode === m ? { background: '#2a2d3a' } : {}}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(false)} className="text-slate-500"><X size={16} /></button>
          </div>

          {addMode === 'upload' ? (
            <div className="flex flex-col gap-2">
              <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" />
              <button onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 text-slate-400 hover:text-slate-200 hover:border-indigo-500/50 transition-colors"
                style={{ borderColor: '#2a2d3a' }}>
                <FileText size={28} />
                <span className="text-sm">{uploading ? 'Uploading…' : 'Click to upload a file'}</span>
                <span className="text-xs text-slate-600">PDF, DOC, DOCX, images</span>
              </button>
              <select value={uploadIncidentId} onChange={e => setUploadIncidentId(e.target.value)}
                className={inputClass} style={inputStyle}>
                <option value="">No linked incident</option>
                {incidents.map(i => (
                  <option key={i.id} value={i.id}>{format(new Date(i.date), 'd MMM yyyy')} — {i.title}</option>
                ))}
              </select>
              {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input placeholder="Document title *" value={gdriveForm.title}
                onChange={e => setGdriveForm(f => ({ ...f, title: e.target.value }))}
                className={inputClass} style={inputStyle} />
              <input placeholder="Google Doc ID (from the URL) *" value={gdriveForm.google_doc_id}
                onChange={e => setGdriveForm(f => ({ ...f, google_doc_id: e.target.value }))}
                className={inputClass} style={inputStyle} />
              <p className="text-xs text-slate-500">Paste the long ID from the Google Docs URL</p>
              <select value={gdriveForm.category} onChange={e => setGdriveForm(f => ({ ...f, category: e.target.value }))}
                className={inputClass} style={inputStyle}>
                {DOC_CATEGORIES.map(c => <option key={c} value={c}>{fmtCat(c)}</option>)}
              </select>
              <select value={gdriveForm.related_incident_id} onChange={e => setGdriveForm(f => ({ ...f, related_incident_id: e.target.value }))}
                className={inputClass} style={inputStyle}>
                <option value="">No linked incident</option>
                {incidents.map(i => (
                  <option key={i.id} value={i.id}>{format(new Date(i.date), 'd MMM yyyy')} — {i.title}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-slate-400">Cancel</button>
                <button onClick={addGdriveDoc} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366f1' }}>
                  Add Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {['all', ...DOC_CATEGORIES].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'text-white' : 'text-slate-400'}`}
            style={filter === f ? { background: '#6366f1' } : { background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            {f === 'all' ? 'All' : fmtCat(f)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <p className="text-slate-400 text-sm">No documents yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(doc => (
            <div key={doc.id} className="group relative">
              <DocumentViewer doc={doc} />
              {can.delete && (
                <button onClick={() => setConfirmDel(doc)}
                  className="absolute top-2 right-2 p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={13} />
                </button>
              )}
              <p className="text-xs text-slate-600 mt-1 pl-1">
                {format(new Date(doc.created_at), 'd MMM yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirmDel} title="Delete Document"
        message={`Delete "${confirmDel?.title}"? This cannot be undone.`}
        confirmLabel="Delete" onConfirm={() => deleteDoc(confirmDel)} onCancel={() => setConfirmDel(null)} />
    </div>
  )
}
