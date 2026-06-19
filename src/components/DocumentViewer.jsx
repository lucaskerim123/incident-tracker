import { useState } from 'react'
import { ExternalLink, Download, FileText, Lock, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const fmtCat = s => s === 'avo' ? 'AVO' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function DocModal({ url, title, onClose }) {
  const [loaded, setLoaded] = useState(false)
  const isPdf = url.includes('.pdf') || url.includes('application/pdf')
  const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80" onClick={onClose} />
      <div className="fixed inset-4 z-50 flex flex-col rounded-xl overflow-hidden"
        style={{ background: '#0f1117', border: '1px solid #2a2d3a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} className="text-slate-500 shrink-0" />
            <span className="text-sm font-medium text-slate-200 truncate">{title}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a href={url} target="_blank" rel="noopener noreferrer" download
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title="Download">
              <Download size={15} />
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title="Open in new tab">
              <ExternalLink size={15} />
            </a>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
            </div>
          )}
          {isPdf ? (
            <iframe
              src={url}
              title={title}
              className="w-full h-full"
              style={{ border: 'none' }}
              onLoad={() => setLoaded(true)}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-lg"
                onLoad={() => setLoaded(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <FileText size={40} className="text-slate-600" />
              <p className="text-sm text-slate-400">This file type can't be previewed.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" download
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#6366f1' }}>
                <Download size={14} /> Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function DocumentViewer({ doc, compact = false }) {
  const [modalUrl, setModalUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const openDoc = async () => {
    if (loading) return
    if (doc.google_doc_id) {
      window.open(`https://docs.google.com/document/d/${doc.google_doc_id}/edit`, '_blank')
      return
    }
    if (!doc.file_path) return
    setLoading(true)
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600)
    setLoading(false)
    if (data?.signedUrl) setModalUrl(data.signedUrl)
  }

  const isPdf = doc.file_path?.toLowerCase().endsWith('.pdf')
  const isGoogleDoc = !!doc.google_doc_id

  if (compact) {
    return (
      <>
        <button onClick={openDoc} disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition-colors disabled:opacity-40 truncate max-w-[160px]">
          {loading
            ? <Loader2 size={11} className="animate-spin shrink-0" />
            : <FileText size={11} className="shrink-0" />}
          <span className="truncate">{doc.title || doc.file_name || 'Document'}</span>
        </button>
        {modalUrl && <DocModal url={modalUrl} title={doc.title || doc.file_name} onClose={() => setModalUrl(null)} />}
      </>
    )
  }

  return (
    <>
      <div className="rounded-xl p-4 border flex items-start gap-3 hover:border-indigo-500/40 transition-all cursor-pointer group"
        style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
        onClick={openDoc}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)' }}>
          {loading
            ? <Loader2 size={20} className="text-indigo-400 animate-spin" />
            : <FileText size={20} className="text-indigo-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium text-slate-100 truncate">{doc.title}</p>
            {doc.restricted && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                <Lock size={9} />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isGoogleDoc ? 'Google Drive' : isPdf ? 'PDF' : 'Document'}
            {doc.category && ` · ${fmtCat(doc.category)}`}
          </p>
          {doc.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-1">{doc.description}</p>
          )}
        </div>
        {isGoogleDoc
          ? <ExternalLink size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
          : <Download size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />}
      </div>
      {modalUrl && <DocModal url={modalUrl} title={doc.title || doc.file_name} onClose={() => setModalUrl(null)} />}
    </>
  )
}
