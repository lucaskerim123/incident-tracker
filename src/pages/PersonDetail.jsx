import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, Pencil, Calendar, Scale, ExternalLink, Lock, Check,
  Link2, Trash2, Plus, X, ChevronRight, FileText, AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

const CATEGORY_COLORS = {
  dv: { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
  harassment: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c' },
  legal: { bg: 'rgba(234,179,8,0.12)', text: '#fbbf24' },
  welfare: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  other: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
}

function toForm(p) {
  return {
    name: p.name ?? '',
    role: p.role ?? '',
    dob: p.dob ?? '',
    bio: p.bio ?? '',
    labelsStr: (p.labels ?? []).join(', '),
    associateLabelsStr: (p.associate_labels ?? []).join(', '),
    legal_update: p.legal_update ?? '',
    legal_notes: p.legal_notes ?? '',
    profile_url: p.profile_url ?? '',
    notes: p.notes ?? '',
  }
}

export default function PersonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = usePermissions()

  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  // Relationships
  const [outgoing, setOutgoing] = useState([])   // this person → others
  const [incoming, setIncoming] = useState([])   // others → this person (backlinks)
  const [allPeople, setAllPeople] = useState([]) // for picker
  const [addingRel, setAddingRel] = useState(false)
  const [relForm, setRelForm] = useState({ to_person_id: '', label: '' })
  const [relSaving, setRelSaving] = useState(false)

  // Incidents
  const [incidents, setIncidents] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [personRes, allPeopleRes] = await Promise.all([
        supabase.from('people').select('*').eq('id', id).single(),
        supabase.from('people').select('id, name').order('name'),
      ])

      if (cancelled) return
      const p = personRes.data
      setPerson(p)
      if (p) setForm(toForm(p))
      setAllPeople((allPeopleRes.data ?? []).filter(x => x.id !== id))
      setLoading(false)

      if (!p) return

      const [outRes, inRes, incRes] = await Promise.all([
        supabase.from('person_relationships')
          .select('id, label, to_person_id, people!person_relationships_to_person_id_fkey(id, name)')
          .eq('from_person_id', id)
          .order('created_at'),
        supabase.from('person_relationships')
          .select('id, label, from_person_id, people!person_relationships_from_person_id_fkey(id, name)')
          .eq('to_person_id', id)
          .order('created_at'),
        supabase.from('incidents')
          .select('id, date, title, category, severity')
          .contains('people_involved', [p.name])
          .order('date', { ascending: false }),
      ])

      if (cancelled) return
      setOutgoing(outRes.data ?? [])
      setIncoming(inRes.data ?? [])
      setIncidents(incRes.data ?? [])
    }

    load()
    return () => { cancelled = true }
  }, [id])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const labels = form.labelsStr.split(',').map(s => s.trim()).filter(Boolean)
    const associate_labels = form.associateLabelsStr.split(',').map(s => s.trim()).filter(Boolean)
    const { data } = await supabase.from('people').update({
      name: form.name.trim(),
      role: form.role.trim() || null,
      dob: form.dob || null,
      bio: form.bio.trim() || null,
      labels,
      associate_labels,
      legal_update: form.legal_update.trim() || null,
      legal_notes: form.legal_notes.trim() || null,
      profile_url: form.profile_url.trim() || null,
      notes: form.notes.trim() || null,
    }).eq('id', id).select().single()
    if (data) {
      setPerson(data)
      setForm(toForm(data))
      setEditing(false)
    }
    setSaving(false)
  }

  const cancelEdit = () => {
    setForm(toForm(person))
    setEditing(false)
  }

  const addRelationship = async () => {
    if (!relForm.to_person_id || !relForm.label.trim()) return
    setRelSaving(true)
    const { data } = await supabase.from('person_relationships').insert({
      from_person_id: id,
      to_person_id: relForm.to_person_id,
      label: relForm.label.trim(),
    }).select('id, label, to_person_id, people!person_relationships_to_person_id_fkey(id, name)').single()
    if (data) {
      setOutgoing(o => [...o, data])
      setRelForm({ to_person_id: '', label: '' })
      setAddingRel(false)
    }
    setRelSaving(false)
  }

  const deleteRelationship = async (relId) => {
    await supabase.from('person_relationships').delete().eq('id', relId)
    setOutgoing(o => o.filter(r => r.id !== relId))
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!person) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-20">
      <p className="text-sm text-slate-500">Person not found.</p>
      <button onClick={() => navigate('/people')}
        className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">
        ← Back to People
      </button>
    </div>
  )

  const hasRelationships = outgoing.length > 0 || incoming.length > 0 || (can.managePeople && addingRel)

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/people')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} /> People
        </button>
        {can.managePeople && (
          editing ? (
            <div className="flex gap-2">
              <button onClick={cancelEdit}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#6366f1' }}>
                <Check size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#6366f1' }}>
              <Pencil size={14} /> Edit
            </button>
          )
        )}
      </div>

      {editing ? (
        /* ── Edit form ── */
        <div className="rounded-xl p-5 border" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
          <div className="flex flex-col gap-3">
            <input placeholder="Name *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <input placeholder="Role (short primary description)" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date of birth</label>
              <input type="date" value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Bio / Overview</label>
              <textarea rows={4} placeholder="General overview or summary visible to all roles…"
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Labels <span className="text-slate-600">(comma-separated)</span>
              </label>
              <input placeholder="e.g. Former partner, Mother of Evelyn" value={form.labelsStr}
                onChange={e => setForm(f => ({ ...f, labelsStr: e.target.value }))}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Associate Labels <span className="text-slate-600">(comma-separated)</span>
              </label>
              <input placeholder="e.g. Central figure, Witness" value={form.associateLabelsStr}
                onChange={e => setForm(f => ({ ...f, associateLabelsStr: e.target.value }))}
                className={inputClass} style={inputStyle} />
            </div>
            <input placeholder="Legal update (e.g. AVO dismissed)" value={form.legal_update}
              onChange={e => setForm(f => ({ ...f, legal_update: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Legal notes (private)</label>
              <textarea rows={4} placeholder="Private legal strategy / lawyer-facing notes…"
                value={form.legal_notes} onChange={e => setForm(f => ({ ...f, legal_notes: e.target.value }))}
                className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
            <input placeholder="External profile URL" value={form.profile_url}
              onChange={e => setForm(f => ({ ...f, profile_url: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mental health reference (private)</label>
              <textarea rows={8} placeholder="Private mental health reference…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
          </div>
        </div>
      ) : (
        /* ── Profile view ── */
        <>
          {/* Identity */}
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-100">{person.name}</h1>
              {person.status === 'awaiting_review' && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
                  Awaiting Review
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {person.dob && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} />
                  DOB: {format(parseISO(person.dob), 'd MMMM yyyy')}
                </p>
              )}
              {person.role && <p className="text-sm text-slate-400">{person.role}</p>}
            </div>
          </div>

          {/* Bio */}
          {person.bio && (
            <div className="mb-6 rounded-lg p-4" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{person.bio}</p>
            </div>
          )}

          {/* Labels */}
          {(person.labels?.length > 0 || person.associate_labels?.length > 0) && (
            <div className="mb-5">
              {person.labels?.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Labels</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {person.labels.map(l => (
                      <span key={l} className="text-xs px-2.5 py-1 rounded-md font-medium"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {person.associate_labels?.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Associate Labels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {person.associate_labels.map(l => (
                      <span key={l} className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8' }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Relationships */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Link2 size={12} className="text-slate-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relationships</p>
              </div>
              {can.managePeople && !addingRel && (
                <button onClick={() => setAddingRel(true)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus size={12} /> Add
                </button>
              )}
            </div>

            {/* Add relationship form */}
            {addingRel && (
              <div className="rounded-lg p-3 mb-2 border" style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
                <div className="flex flex-col gap-2">
                  <select value={relForm.to_person_id}
                    onChange={e => setRelForm(f => ({ ...f, to_person_id: e.target.value }))}
                    className={inputClass} style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="">Select person…</option>
                    {allPeople.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input placeholder="Relationship label (e.g. Father of, Former partner of)"
                    value={relForm.label}
                    onChange={e => setRelForm(f => ({ ...f, label: e.target.value }))}
                    className={inputClass} style={inputStyle} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setAddingRel(false); setRelForm({ to_person_id: '', label: '' }) }}
                      className="text-xs text-slate-400 hover:text-slate-200">
                      Cancel
                    </button>
                    <button onClick={addRelationship} disabled={relSaving || !relForm.to_person_id || !relForm.label.trim()}
                      className="px-2.5 py-1 rounded text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: '#6366f1' }}>
                      {relSaving ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {outgoing.length === 0 && incoming.length === 0 && !addingRel ? (
              <p className="text-xs text-slate-600 italic">No relationships linked yet.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {outgoing.map(rel => (
                  <div key={rel.id} className="flex items-center gap-2 group">
                    <span className="text-xs text-slate-500 shrink-0">→</span>
                    <span className="text-xs text-slate-400 shrink-0">{rel.label}</span>
                    <button
                      onClick={() => navigate(`/people/${rel.people.id}`)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-0.5">
                      {rel.people.name}
                      <ChevronRight size={11} />
                    </button>
                    {can.managePeople && (
                      <button onClick={() => deleteRelationship(rel.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
                {incoming.map(rel => (
                  <div key={rel.id} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 shrink-0">←</span>
                    <button
                      onClick={() => navigate(`/people/${rel.people.id}`)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium flex items-center gap-0.5">
                      {rel.people.name}
                      <ChevronRight size={11} />
                    </button>
                    <span className="text-xs text-slate-600 shrink-0">{rel.label}</span>
                    <span className="text-xs text-slate-700 ml-auto shrink-0">backlink</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incidents */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText size={12} className="text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Incidents {incidents.length > 0 && `· ${incidents.length}`}
              </p>
            </div>
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No incidents linked to this person.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {incidents.map(inc => {
                  const cat = CATEGORY_COLORS[inc.category] ?? CATEGORY_COLORS.other
                  return (
                    <button key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="flex items-center gap-2.5 w-full text-left rounded-lg px-3 py-2 hover:border-indigo-500/20 transition-colors"
                      style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{inc.title || '(Untitled)'}</p>
                        {inc.date && (
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {format(parseISO(inc.date), 'd MMM yyyy')}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: cat.bg, color: cat.text }}>
                        {inc.category ?? 'other'}
                      </span>
                      <ChevronRight size={13} className="text-slate-600 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legal (gated) */}
          {can.viewSensitiveNotes && (person.legal_update || person.legal_notes) && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Scale size={11} className="text-amber-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</p>
                <Lock size={10} className="text-slate-700 ml-0.5" />
              </div>
              {person.legal_update && (
                <div className="flex items-start gap-2 p-3 rounded-lg mb-2"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-300">{person.legal_update}</p>
                </div>
              )}
              {person.legal_notes && (
                <div className="rounded-lg p-4" style={{ background: '#0f1117', border: '1px solid #2a2d3a' }}>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{person.legal_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Mental Health Reference (gated) */}
          {can.viewSensitiveNotes && person.notes && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Lock size={11} className="text-slate-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Private Mental Health Reference
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ background: '#0f1117', border: '1px solid #2a2d3a' }}>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{person.notes}</p>
              </div>
            </div>
          )}

          {/* External Profile */}
          {person.profile_url && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">External Profile</p>
              <a href={person.profile_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors break-all"
                onClick={e => e.stopPropagation()}>
                <ExternalLink size={13} className="shrink-0" />
                {person.profile_url}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}
