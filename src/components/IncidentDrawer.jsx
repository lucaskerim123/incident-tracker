import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { X, Pencil, Hash, User, MapPin, FileText, Send, Copy, Check, MessageSquare, Clock, Trash2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import CategoryBadge from './CategoryBadge'

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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</h3>
      {children}
    </div>
  )
}

export default function IncidentDrawer({ incidentId, onClose }) {
  const navigate = useNavigate()
  const { user, userCode } = useAuth()
  const { can } = usePermissions()
  const [incident, setIncident] = useState(null)
  const [comments, setComments] = useState([])
  const [userNames, setUserNames] = useState({})
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [idCopied, setIdCopied] = useState(false)

  useEffect(() => {
    if (!incidentId) return
    setLoading(true)
    setIncident(null)
    setComments([])
    Promise.all([
      supabase.from('incidents').select('*').eq('id', incidentId).single(),
      supabase.from('incident_comments').select('*').eq('incident_id', incidentId).order('created_at'),
    ]).then(([incRes, commentsRes]) => {
      if (!incRes.error) setIncident(incRes.data)
      const loaded = commentsRes.data ?? []
      setComments(loaded)
      const ids = [...new Set(loaded.map(c => c.user_id).filter(Boolean))]
      if (ids.length > 0) {
        supabase.from('users').select('id, display_name').in('id', ids)
          .then(({ data }) => {
            const map = {}
            ;(data ?? []).forEach(u => { map[u.id] = u.display_name })
            setUserNames(map)
          })
      }
      setLoading(false)
    })
  }, [incidentId])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const postComment = async () => {
    const content = commentText.trim()
    if (!content || postingComment) return
    setPostingComment(true)
    const optimistic = { id: crypto.randomUUID(), incident_id: incidentId, user_id: user.id, user_code: userCode, content, created_at: new Date().toISOString() }
    setComments(c => [...c, optimistic])
    setCommentText('')
    const { data, error } = await supabase.from('incident_comments')
      .insert({ incident_id: incidentId, user_id: user.id, user_code: userCode, content })
      .select().single()
    if (!error && data) setComments(c => c.map(x => x.id === optimistic.id ? data : x))
    setPostingComment(false)
  }

  const deleteComment = async (commentId) => {
    setComments(c => c.filter(x => x.id !== commentId))
    await supabase.from('incident_comments').delete().eq('id', commentId)
  }

  const copyId = async () => {
    await navigator.clipboard.writeText(incidentId)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[500px] lg:w-[560px]"
        style={{ background: '#0f1117', borderLeft: '1px solid #2a2d3a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2 min-w-0">
            {incident && <CategoryBadge category={incident.category} size="xs" />}
            <button onClick={copyId}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 hover:text-slate-400 transition-colors shrink-0"
              style={{ background: '#1a1d27' }}>
              {idCopied ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} />}
              {incidentId?.slice(0, 8)}…
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            {incident && can.edit && (
              <button
                onClick={() => navigate(`/incidents/${incidentId}/edit`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                <Pencil size={12} /> Edit
              </button>
            )}
            <button
              onClick={() => { onClose(); navigate(`/incidents/${incidentId}`) }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              title="Open full page">
              <ExternalLink size={15} />
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !incident ? (
            <p className="text-sm text-slate-400 text-center py-12">Incident not found.</p>
          ) : (
            <DrawerContent
              incident={incident}
              comments={comments}
              userNames={userNames}
              commentText={commentText}
              setCommentText={setCommentText}
              postingComment={postingComment}
              postComment={postComment}
              deleteComment={deleteComment}
              can={can}
              user={user}
            />
          )}
        </div>
      </div>
    </>
  )
}

function DrawerContent({ incident, comments, userNames, commentText, setCommentText, postingComment, postComment, deleteComment, can, user }) {
  const s = STATUS_STYLES[incident.status] ?? STATUS_STYLES.documented
  const sev = SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.medium

  return (
    <div className="p-4 pb-8">
      {/* Badges + date */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <span style={{ background: s.bg, color: s.text, padding: '3px 8px', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
            {incident.status}
          </span>
          {incident.severity && (
            <span style={{ background: sev.bg, color: sev.text, padding: '3px 8px', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
              {incident.severity}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <time className="text-xs text-slate-400">
            {format(new Date(incident.date), 'd MMMM yyyy')}
          </time>
          {incident.incident_time && (
            <div className="flex items-center gap-1 justify-end mt-0.5 text-xs text-slate-600">
              <Clock size={9} />
              {incident.incident_time.slice(0, 5)}
            </div>
          )}
        </div>
      </div>

      <h1 className="text-base font-bold text-slate-100 mb-4 leading-snug">{incident.title}</h1>

      {incident.reference_number && (
        <div className="flex items-center gap-2 mb-4 px-2.5 py-1.5 rounded-lg" style={{ background: '#1a1d27' }}>
          <Hash size={13} className="text-slate-500" />
          <span className="text-xs font-mono text-slate-300">{incident.reference_number}</span>
        </div>
      )}

      {incident.location && (
        <Field label="Location">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-slate-500 shrink-0" />
            <p className="text-sm text-slate-300">{incident.location}</p>
          </div>
        </Field>
      )}

      <Field label="Description">
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
      </Field>

      {incident.outcome && (
        <div className="mb-4 p-3 rounded-lg border-l-2 border-indigo-500" style={{ background: '#1a1d27' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Outcome</h3>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.outcome}</p>
        </div>
      )}

      {/* Evidence Notes — restricted: editor / lawyer / admin only */}
      {incident.evidence_notes && can.viewSensitiveNotes && (
        <div className="mb-4 p-3 rounded-lg border" style={{ background: 'rgba(234,179,8,0.05)', borderColor: 'rgba(234,179,8,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText size={11} className="text-amber-400/70" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500/70">Evidence Notes</h3>
            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded font-semibold text-amber-500/60" style={{ background: 'rgba(234,179,8,0.12)' }}>RESTRICTED</span>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.evidence_notes}</p>
        </div>
      )}

      {incident.people_involved?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <User size={12} className="text-slate-500" />
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

      {/* Comments */}
      <div className="rounded-xl border mt-2" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: '#2a2d3a' }}>
          <MessageSquare size={13} className="text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Comments {comments.length > 0 && `· ${comments.length}`}
          </h3>
        </div>

        {comments.length === 0 && !can.canComment ? (
          <p className="text-xs text-slate-600 text-center py-5">No comments yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1e2130' }}>
            {comments.map(c => (
              <div key={c.id} className="px-3 py-2.5 flex gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {userNames[c.user_id] && (
                      <span className="text-xs font-semibold text-slate-300">{userNames[c.user_id]}</span>
                    )}
                    <span className="text-xs font-mono text-slate-500">#{c.user_code ?? '—'}</span>
                    <span className="text-xs text-slate-600">{format(new Date(c.created_at), 'd MMM · HH:mm')}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
                {(can.delete || c.user_id === user?.id) && (
                  <button onClick={() => deleteComment(c.id)}
                    className="shrink-0 p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors self-start mt-0.5">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {can.canComment && (
          <div className="px-3 py-2.5 border-t flex gap-2" style={{ borderColor: '#2a2d3a' }}>
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
              <Send size={15} />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 mt-3">
        Added {format(new Date(incident.created_at), 'd MMM yyyy')}
        {incident.updated_at !== incident.created_at && ` · Updated ${format(new Date(incident.updated_at), 'd MMM yyyy')}`}
      </p>
    </div>
  )
}
