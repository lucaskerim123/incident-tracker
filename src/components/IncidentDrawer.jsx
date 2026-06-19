import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { X, Pencil, Send, Trash2, MessageSquare, FileText, ExternalLink, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'

const ROLE_TERMS = /\b(police|court|constable|magistrate|inspector|sergeant|sgt|procon|lecc|unknown)\b/i

function filterPeople(people) {
  return (people ?? []).filter(p => {
    const name = p.trim()
    if (!name) return false
    if (ROLE_TERMS.test(name)) return false
    return true
  })
}

const STATUS_STYLES = {
  documented: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  resolved:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</h3>
      {children}
    </div>
  )
}

export default function IncidentDrawer({ incidentId, onClose }) {
  const navigate = useNavigate()
  const { user, userCode } = useAuth()
  const { can } = usePermissions()
  const [incident, setIncident] = useState(null)
  const [documents, setDocuments] = useState([])
  const [comments, setComments] = useState([])
  const [userNames, setUserNames] = useState({})
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!incidentId) return
    setLoading(true)
    setIncident(null)
    setDocuments([])
    setComments([])
    Promise.all([
      supabase.from('incidents').select('*').eq('id', incidentId).single(),
      supabase.from('documents').select('*').eq('related_incident_id', incidentId).order('created_at'),
      supabase.from('incident_comments').select('*').eq('incident_id', incidentId).order('created_at'),
    ]).then(([incRes, docsRes, commentsRes]) => {
      if (!incRes.error) setIncident(incRes.data)
      setDocuments(docsRes.data ?? [])
      const loaded = commentsRes.data ?? []
      setComments(loaded)
      const ids = [...new Set(loaded.map(c => c.user_id).filter(Boolean))]
      if (ids.length > 0) {
        supabase.from('users').select('id, display_name').in('id', ids).then(({ data }) => {
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

  const getFileUrl = (path) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(path)
    return data?.publicUrl ?? '#'
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[520px] lg:w-[580px]"
        style={{ background: '#0f1117', borderLeft: '1px solid #2a2d3a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2 min-w-0">
            {incident && (
              <span className="text-xs font-mono text-slate-500">
                #{incident.incident_number ?? '—'}
              </span>
            )}
            {incident && (
              <span style={{
                background: STATUS_STYLES[incident.status]?.bg ?? STATUS_STYLES.documented.bg,
                color: STATUS_STYLES[incident.status]?.text ?? STATUS_STYLES.documented.text,
                padding: '2px 7px', fontSize: 10, borderRadius: 5, fontWeight: 600
              }}>
                {incident.status ?? 'documented'}
              </span>
            )}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !incident ? (
            <p className="text-sm text-slate-400 text-center py-12">Incident not found.</p>
          ) : (
            <div className="p-5 pb-10">
              {/* Title */}
              <h1 className="text-base font-bold text-slate-100 leading-snug mb-5">
                {incident.title}
              </h1>

              {/* Full Entry */}
              <Field label="Full Entry">
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {incident.description}
                </p>
              </Field>

              {/* Outcome */}
              {incident.outcome && (
                <Field label="Outcome">
                  <div className="p-3 rounded-lg border-l-2 border-indigo-500" style={{ background: '#1a1d27' }}>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {incident.outcome}
                    </p>
                  </div>
                </Field>
              )}

              {/* Who's involved */}
              {filterPeople(incident.people_involved).length > 0 && (
                <Field label="Who's Involved">
                  <div className="flex items-start gap-2">
                    <User size={13} className="text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {filterPeople(incident.people_involved).map(p => (
                        <span key={p} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </Field>
              )}

              {/* Attached Documents */}
              <Field label={`Attached Documents${documents.length > 0 ? ` · ${documents.length}` : ''}`}>
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-600">No documents attached.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {documents.map(doc => (
                      <a
                        key={doc.id}
                        href={getFileUrl(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border hover:border-indigo-500/40 transition-colors group/doc"
                        style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
                      >
                        <FileText size={13} className="text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300 truncate group-hover/doc:text-indigo-300 transition-colors">
                            {doc.title || doc.file_name}
                          </p>
                          {doc.file_name && doc.title && (
                            <p className="text-[10px] text-slate-600 truncate">{doc.file_name}</p>
                          )}
                        </div>
                        <ExternalLink size={11} className="text-slate-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </Field>

              {/* Evidence Notes — restricted */}
              {incident.evidence_notes && can.viewSensitiveNotes && (
                <Field label="Evidence Notes">
                  <div className="p-3 rounded-lg border" style={{ background: 'rgba(234,179,8,0.05)', borderColor: 'rgba(234,179,8,0.2)' }}>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-amber-500/60 mb-1.5 inline-block" style={{ background: 'rgba(234,179,8,0.12)' }}>RESTRICTED</span>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.evidence_notes}</p>
                  </div>
                </Field>
              )}

              {/* Comments */}
              <div className="rounded-xl border mt-2" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
                <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: '#2a2d3a' }}>
                  <MessageSquare size={13} className="text-slate-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comments{comments.length > 0 && ` · ${comments.length}`}
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

              <p className="text-xs text-slate-600 mt-4">
                Added {format(new Date(incident.created_at), 'd MMM yyyy')}
                {incident.updated_at !== incident.created_at && ` · Updated ${format(new Date(incident.updated_at), 'd MMM yyyy')}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
