import { useState, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

const CATEGORIES = [
  { value: 'legal',         label: 'Legal' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'police',        label: 'Police' },
  { value: 'court',         label: 'Court' },
  { value: 'avo',           label: 'AVO' },
  { value: 'other',         label: 'Other' },
]

const STATUSES = [
  { value: 'documented', label: 'Documented' },
  { value: 'pending',    label: 'Pending' },
  { value: 'resolved',   label: 'Resolved' },
]

const SEVERITIES = [
  { value: 'low',      label: 'Low',      color: '#64748b' },
  { value: 'medium',   label: 'Medium',   color: '#eab308' },
  { value: 'high',     label: 'High',     color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
]

const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }
const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5'

export default function IncidentForm({ initial = {}, onSubmit, loading, submitLabel = 'Save', cases = [], knownPeople = [] }) {
  const [form, setForm] = useState({
    date: initial.date ?? new Date().toISOString().slice(0, 10),
    incident_time: initial.incident_time ?? '',
    title: initial.title ?? '',
    category: initial.category ?? 'legal',
    severity: initial.severity ?? 'medium',
    description: initial.description ?? '',
    location: initial.location ?? '',
    outcome: initial.outcome ?? '',
    evidence_notes: initial.evidence_notes ?? '',
    reference_number: initial.reference_number ?? '',
    linked_case_id: initial.linked_case_id ?? '',
    status: initial.status ?? 'documented',
    people_involved: initial.people_involved ?? [],
  })
  const [personInput, setPersonInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [errors, setErrors] = useState({})
  const suggestRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePersonInput = (val) => {
    setPersonInput(val)
    const q = val.toLowerCase().trim()
    if (q.length > 0) {
      setSuggestions(
        knownPeople
          .filter(p => p.toLowerCase().includes(q) && !form.people_involved.some(i => i.toLowerCase() === p.toLowerCase()))
          .slice(0, 5)
      )
    } else {
      setSuggestions([])
    }
  }

  const addPerson = (name) => {
    const n = (name ?? personInput).trim()
    if (n && !form.people_involved.some(p => p.toLowerCase() === n.toLowerCase())) {
      set('people_involved', [...form.people_involved, n])
    }
    setPersonInput('')
    setSuggestions([])
  }

  const removePerson = (name) =>
    set('people_involved', form.people_involved.filter(p => p !== name))

  const isKnownPerson = (name) =>
    knownPeople.some(k => k.toLowerCase() === name.toLowerCase())

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.date) e.date = 'Date is required'
    if (!form.description.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* ID (edit mode only) */}
      {initial.id && (
        <div>
          <label className={labelClass}>Incident ID</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-mono text-slate-500"
            style={{ background: '#0f1117', borderColor: '#1e2130' }}>
            {initial.id}
          </div>
        </div>
      )}

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Date *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
          {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input type="time" value={form.incident_time} onChange={e => set('incident_time', e.target.value)}
            className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Title *</label>
        <input type="text" placeholder="Brief summary of the incident"
          value={form.title} onChange={e => set('title', e.target.value)}
          className={inputClass} style={inputStyle} />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
      </div>

      {/* Category + Severity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className={inputClass} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Severity</label>
          <select value={form.severity} onChange={e => set('severity', e.target.value)}
            className={inputClass} style={inputStyle}>
            {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description *</label>
        <textarea rows={6} placeholder="Full account of what happened..."
          value={form.description} onChange={e => set('description', e.target.value)}
          className={`${inputClass} resize-none`} style={inputStyle} />
        {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>Location</label>
        <input type="text" placeholder="Where did this occur?"
          value={form.location} onChange={e => set('location', e.target.value)}
          className={inputClass} style={inputStyle} />
      </div>

      {/* Outcome */}
      <div>
        <label className={labelClass}>Outcome</label>
        <input type="text" placeholder="Result, outcome or current situation"
          value={form.outcome} onChange={e => set('outcome', e.target.value)}
          className={inputClass} style={inputStyle} />
      </div>

      {/* Evidence Notes */}
      <div>
        <label className={labelClass}>Evidence Notes</label>
        <textarea rows={3} placeholder="Notes about evidence, witnesses, photos..."
          value={form.evidence_notes} onChange={e => set('evidence_notes', e.target.value)}
          className={`${inputClass} resize-none`} style={inputStyle} />
      </div>

      {/* Linked Case + Reference Number */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Linked Case</label>
          <select value={form.linked_case_id} onChange={e => set('linked_case_id', e.target.value || '')}
            className={inputClass} style={inputStyle}>
            <option value="">None</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.charge || c.case_number || c.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Reference / Event No.</label>
          <input type="text" placeholder="e.g. E184183202"
            value={form.reference_number} onChange={e => set('reference_number', e.target.value)}
            className={inputClass} style={inputStyle} />
        </div>
      </div>

      {/* Who's Involved */}
      <div>
        <label className={labelClass}>Who's Involved</label>
        <div className="relative" ref={suggestRef}>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Type a name and press Enter"
              value={personInput}
              onChange={e => handlePersonInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPerson() } }}
              className={inputClass} style={inputStyle} />
            <button type="button" onClick={() => addPerson()}
              className="px-3 rounded-lg border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0">
              <Plus size={18} />
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full rounded-lg border overflow-hidden text-sm"
              style={{ background: '#1a1d27', borderColor: '#2a2d3a', top: '100%', marginTop: 2 }}>
              {suggestions.map(name => (
                <li key={name}>
                  <button type="button" onMouseDown={() => addPerson(name)}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors">
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {form.people_involved.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.people_involved.map(p => {
              const known = isKnownPerson(p)
              return (
                <span key={p} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                  style={known
                    ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8' }
                    : { background: 'rgba(234,179,8,0.15)', color: '#eab308' }
                  }>
                  {p}
                  {!known && <span className="text-[9px] opacity-60 ml-0.5">new</span>}
                  <button type="button" onClick={() => removePerson(p)} className="hover:text-white ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              )
            })}
          </div>
        )}
        {form.people_involved.some(p => !isKnownPerson(p)) && (
          <p className="text-xs text-amber-600 mt-1.5">
            New names will be added to People as awaiting review.
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className={labelClass}>Status</label>
        <select value={form.status} onChange={e => set('status', e.target.value)}
          className={inputClass} style={inputStyle}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white transition-colors mt-2 disabled:opacity-50"
        style={{ background: loading ? '#4f46e5' : '#6366f1' }}>
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
