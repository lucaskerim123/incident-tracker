import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Pencil, Calendar, Scale, ExternalLink, Lock, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

function toForm(p) {
  return {
    name: p.name ?? '',
    role: p.role ?? '',
    dob: p.dob ?? '',
    labelsStr: (p.labels ?? []).join(', '),
    associateLabelsStr: (p.associate_labels ?? []).join(', '),
    legal_update: p.legal_update ?? '',
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

  useEffect(() => {
    supabase.from('people').select('*').eq('id', id).single()
      .then(({ data }) => {
        setPerson(data)
        if (data) setForm(toForm(data))
        setLoading(false)
      })
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
      labels,
      associate_labels,
      legal_update: form.legal_update.trim() || null,
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

  return (
    <div className="p-4 max-w-2xl mx-auto">

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
            <input placeholder="Role (primary description)" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date of birth</label>
              <input type="date" value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
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
            <input placeholder="External profile URL" value={form.profile_url}
              onChange={e => setForm(f => ({ ...f, profile_url: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <textarea rows={8} placeholder="Private notes / mental health reference"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={`${inputClass} resize-none`} style={inputStyle} />
          </div>
        </div>
      ) : (
        /* ── Profile view ── */
        <>
          {/* Name + DOB + role */}
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
            {person.dob && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar size={13} />
                DOB: {format(parseISO(person.dob), 'd MMMM yyyy')}
              </p>
            )}
            {person.role && <p className="text-sm text-slate-400 mt-1">{person.role}</p>}
          </div>

          {/* Labels */}
          {person.labels?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {person.labels.map(l => (
                  <span key={l} className="text-xs px-2.5 py-1 rounded-md font-medium"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Associate Labels */}
          {person.associate_labels?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Associate Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {person.associate_labels.map(l => (
                  <span key={l} className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8' }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Legal Update */}
          {person.legal_update && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-lg"
              style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <Scale size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-300">{person.legal_update}</p>
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

          {/* Private Notes — hidden from viewer */}
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
        </>
      )}
    </div>
  )
}
