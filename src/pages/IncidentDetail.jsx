import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Pencil, Trash2, Hash, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'
import CategoryBadge from '../components/CategoryBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import DocumentViewer from '../components/DocumentViewer'

const STATUS_STYLES = {
  documented: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  resolved:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [incident, setIncident] = useState(null)
  const [docs, setDocs] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('incidents').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setIncident(data)
      })
    supabase.from('documents').select('*').eq('related_incident_id', id)
      .then(({ data }) => setDocs(data ?? []))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('incidents').delete().eq('id', id)
    navigate('/incidents')
  }

  if (notFound) return (
    <div className="p-4 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="p-1.5 mb-4 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
        <ArrowLeft size={20} />
      </button>
      <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <p className="text-slate-400 text-sm">Incident not found.</p>
      </div>
    </div>
  )

  if (!incident) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = STATUS_STYLES[incident.status] ?? STATUS_STYLES.documented

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          {can.edit && (
            <button onClick={() => navigate(`/incidents/${id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 border hover:text-slate-100 hover:border-indigo-500/50 transition-colors"
              style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <Pencil size={14} /> Edit
            </button>
          )}
          {can.delete && (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              style={{ background: '#1a1d27' }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl p-5 border mb-3" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={incident.category} />
            <span style={{ background: s.bg, color: s.text, padding: '4px 10px', fontSize: 12, borderRadius: 6, fontWeight: 600 }}>
              {incident.status}
            </span>
          </div>
          <time className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            {format(new Date(incident.date), 'd MMMM yyyy')}
          </time>
        </div>

        <h1 className="text-lg font-bold text-slate-100 mb-4">{incident.title}</h1>

        {incident.reference_number && (
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
            <Hash size={14} className="text-slate-500" />
            <span className="text-xs font-mono text-slate-300">{incident.reference_number}</span>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
        </div>

        {incident.outcome && (
          <div className="mb-4 p-3 rounded-lg border-l-2 border-indigo-500" style={{ background: '#0f1117' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Outcome</h3>
            <p className="text-sm text-slate-300">{incident.outcome}</p>
          </div>
        )}

        {incident.people_involved?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <User size={13} className="text-slate-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">People Involved</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {incident.people_involved.map(p => (
                <span key={p} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {docs.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">Attached Documents</h3>
          <div className="flex flex-col gap-2">
            {docs.map(d => <DocumentViewer key={d.id} doc={d} />)}
          </div>
        </div>
      )}

      <div className="mt-3 px-1">
        <p className="text-xs text-slate-600">
          Added {format(new Date(incident.created_at), 'd MMM yyyy')}
          {incident.updated_at !== incident.created_at && ` · Updated ${format(new Date(incident.updated_at), 'd MMM yyyy')}`}
        </p>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Incident"
        message="This will permanently delete this incident and cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
