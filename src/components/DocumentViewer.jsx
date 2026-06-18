import { ExternalLink, Download, FileText, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

const fmtCat = s => s === 'avo' ? 'AVO' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function DocumentViewer({ doc }) {
  const openDoc = async () => {
    if (doc.file_path) {
      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } else if (doc.google_doc_id) {
      window.open(`https://docs.google.com/document/d/${doc.google_doc_id}/edit`, '_blank')
    }
  }

  const isPdf = doc.file_path?.toLowerCase().endsWith('.pdf')
  const isGoogleDoc = !!doc.google_doc_id

  return (
    <div className="rounded-xl p-4 border flex items-start gap-3 hover:border-indigo-500/40 transition-all cursor-pointer group"
      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
      onClick={openDoc}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(99,102,241,0.15)' }}>
        <FileText size={20} className="text-indigo-400" />
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
        : <Download size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
      }
    </div>
  )
}
