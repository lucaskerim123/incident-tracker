import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Pencil, Trash2, Hash, User, MapPin, FileText, Send, Copy, Check, MessageSquare, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import CategoryBadge from '../components/CategoryBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import DocumentViewer from '../components/DocumentViewer'

const STATUS_STYLES = {
  documented: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  resolved:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

const SEVERITY_STYLES = {
  low:      { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  medium:   { bg: 'rgba(234,179,8,0.15)',   text: '#eab308' },
  high:     { bg: 'rgba(249,115,22,0.15)',  text: '#f97316' },
  critical: { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</h3>
      {children}
    </div>
  )
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userCode } = useAuth()
  const { can } = usePermissions()
  const [incident, setIncident] = useState(null)
  const [docs, setDocs] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [linkedCase, setLinkedCase] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [idCopied, setIdCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('incidents').select('*').eq('id', id).single(),
      supabase.from('documents').select('*').eq('related_incident_id', id),
      supabase.from('incident_comments').select('*').eq('incident_id', id).order('created_at'),
    ]).then(([incRes, docsRes, commentsRes]) => {
      if (incRes.error || !incRes.data) { setNotFound(true); return }
      setIncident(incRes.data)
      setDocs(docsRes.data ?? [])
      setComments(commentsRes.data ?? [])
      if (incRes.data.linked_case_id) {
        supabase.from('cases').select('charge, case_number').eq('id', incRes.data.linked_case_id).single()
          .then(({ data }) => setLinkedCase(data))
      }
    })
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('incidents').delete().eq('id', id)
    navigate('/incidents')
  }

  const copyId = async () => {
    await navigator.clipboard.writeText(id)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }

  const postComment = async () => {
    const content = commentText.trim()
    if (!content || postingComment) return
    setPostingComment(true)
    const optimistic = { id: crypto.randomUUID(), incident_id: id, user_id: user.id, user_code: userCode, content, created_at: new Date().toISOString() }
    setComments(c => [...c, optimistic])
    setCommentText('')
    const { data, error } = await supabase.from('incident_comments')
      .insert({ incident_id: id, user_id: user.id, user_code: userCode, content })
      .select().single()
    if (!error && data) {
      setComments(c => c.map(x => x.id === optimistic.id ? data : x))
    }
    setPostingComment(false)
  }

  const deleteComment = async (commentId) => {
    setComments(c => c.filter(x => x.id !== commentId))
    await supabase.from('incident_comments').delete().eq('id', commentId)
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
  const sev = SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.medium

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      {/* Header */}
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

      {/* Main card */}
      <div className="rounded-xl p-5 border mb-3" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        {/* ID chip */}
        <button onClick={copyId}
          className="flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
          style={{ background: '#0f1117' }}>
          {idCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          {id}
        </button>

        {/* Badges + date */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={incident.category} />
            <span style={{ background: s.bg, color: s.text, padding: '4px 10px', fontSize: 12, borderRadius: 6, fontWeight: 600 }}>
              {incident.status}
            </span>
            {incident.severity && (
              <span style={{ background: sev.bg, color: sev.text, padding: '4px 10px', fontSize: 12, borderRadius: 6, fontWeight: 600 }}>
                {incident.severity}
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <time className="text-xs text-slate-500 block">
              {format(new Date(incident.date), 'd MMMM yyyy')}
            </time>
            {incident.incident_time && (
              <span className="text-xs text-slate-600 flex items-center gap-1 justify-end mt-0.5">
                <Clock size={10} />
                {incident.incident_time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-lg font-bold text-slate-100 mb-4">{incident.title}</h1>

        {/* Reference */}
        {incident.reference_number && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
            <Hash size={14} className="text-slate-500" />
            <span className="text-xs font-mono text-slate-300">{incident.reference_number}</span>
          </div>
        )}

        {/* Location */}
        {incident.location && (
          <Field label="Location">
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-slate-500 shrink-0" />
              <p className="text-sm text-slate-300">{incident.location}</p>
            </div>
          </Field>
        )}

        {/* Linked Case */}
        {linkedCase && (
          <Field label="Linked Case">
            <p className="text-sm text-slate-300">{linkedCase.charge || linkedCase.case_number}</p>
          </Field>
        )}

        {/* Description */}
        <Field label="Description">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
        </Field>

        {/* Outcome */}
        {incident.outcome && (
          <div className="mb-4 p-3 rounded-lg border-l-2 border-indigo-500" style={{ background: '#0f1117' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Outcome</h3>
            <p className="text-sm text-slate-300">{incident.outcome}</p>
          </div>
        )}

        {/* Evidence Notes */}
        {incident.evidence_notes && (
          <Field label="Evidence Notes">
            <div className="flex gap-2">
              <FileText size={13} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.evidence_notes}</p>
            </div>
          </Field>
        )}

        {/* People Involved */}
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

      {/* Attached Documents */}
      {docs.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">Attached Documents</h3>
          <div className="flex flex-col gap-2">
            {docs.map(d => <DocumentViewer key={d.id} doc={d} />)}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="rounded-xl border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#2a2d3a' }}>
          <MessageSquare size={14} className="text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Comments {comments.length > 0 && `· ${comments.length}`}
          </h3>
        </div>

        {comments.length === 0 && !can.canComment ? (
          <p className="text-xs text-slate-600 text-center py-6">No comments yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1e2130' }}>
            {comments.map(c => (
              <div key={c.id} className="px-4 py-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400 font-mono">#{c.user_code ?? '—'}</span>
                    <span className="text-xs text-slate-600">
                      {format(new Date(c.created_at), 'd MMM yyyy · HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
                {(can.delete || c.user_id === user?.id) && (
                  <button onClick={() => deleteComment(c.id)}
                    className="shrink-0 p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors self-start mt-1">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {can.canComment && (
          <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: '#2a2d3a' }}>
            <textarea
              rows={2}
              placeholder="Add a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment() }}
              className="flex-1 rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors resize-none"
              style={{ background: '#0f1117', borderColor: '#2a2d3a' }}
            />
            <button onClick={postComment} disabled={!commentText.trim() || postingComment}
              className="shrink-0 p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-30 transition-colors self-end">
              <Send size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
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
