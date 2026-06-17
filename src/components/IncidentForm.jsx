import { useState } from 'react'
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

const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }
const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5'

export default function IncidentForm({ initial = {}, onSubmit, loading, submitLabel = 'Save' }) {
  const [form, setForm] = useState({
    date: initial.date ?? new Date().toISOString().slice(0, 10),
    title: initial.title ?? '',
    category: initial.category ?? 'legal',
    description: initial.description ?? '',
    outcome: initial.outcome ?? '',
    reference_number: initial.reference_number ?? '',
    status: initial.status ?? 'documented',
    people_involved: initial.people_involved ?? [],
  })
  const [personInput, setPersonInput] = useState('')
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addPerson = () => {
    const name = personInput.trim()
    if (name && !form.people_involved.includes(name)) {
      set('people_involved', [...form.people_involved, name])
      setPersonInput('')
    }
  }

  const removePerson = (name) =>
    set('people_involved', form.people_involved.filter(p => p !== name))

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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
          {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className={inputClass} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Title</label>
        <input type="text" placeholder="Brief summary of the incident"
          value={form.title} onChange={e => set('title', e.target.value)}
          className={inputClass} style={inputStyle} />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea rows={6} placeholder="Full account of what happened..."
          value={form.description} onChange={e => set('description', e.target.value)}
          className={`${inputClass} resize-none`} style={inputStyle} />
        {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Reference / Event No.</label>
          <input type="text" placeholder="e.g. E184183202"
            value={form.reference_number} onChange={e => set('reference_number', e.target.value)}
            className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className={inputClass} style={inputStyle}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Outcome</label>
        <input type="text" placeholder="Result, outcome or current situation"
          value={form.outcome} onChange={e => set('outcome', e.target.value)}
          className={inputClass} style={inputStyle} />
      </div>

      <div>
        <label className={labelClass}>People Involved</label>
        <div className="flex gap-2 mb-2">
          <input type="text" placeholder="Add a name and press Enter"
            value={personInput}
            onChange={e => setPersonInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPerson() } }}
            className={inputClass} style={inputStyle} />
          <button type="button" onClick={addPerson}
            className="px-3 rounded-lg border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0">
            <Plus size={18} />
          </button>
        </div>
        {form.people_involved.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.people_involved.map(p => (
              <span key={p} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                {p}
                <button type="button" onClick={() => removePerson(p)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white transition-colors mt-2 disabled:opacity-50"
        style={{ background: loading ? '#4f46e5' : '#6366f1' }}>
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
