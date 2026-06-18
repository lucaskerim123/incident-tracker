import { useEffect, useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { Plus, Pencil, Trash2, X, Calendar, MapPin, Search, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

const CASE_STATUS = ['active', 'pending', 'closed']
const STATUS_STYLE = {
  active:  { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  pending: { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  closed:  { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}
const STATUS_ORDER = { active: 0, pending: 1, closed: 2 }

const EMPTY = { case_number: '', charge: '', status: 'active', court_date: '', court_location: '', notes: '' }

function CaseForm({ initial = EMPTY, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.charge.trim()) { setError('Charge / matter description is required.'); return }
    setError('')
    onSave(form)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Case number" value={form.case_number} onChange={e => set('case_number', e.target.value)}
          className={inputClass} style={inputStyle} />
        <select value={form.status} onChange={e => set('status', e.target.value)}
          className={inputClass} style={inputStyle}>
          {CASE_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <input placeholder="Charge / Matter description *" value={form.charge} onChange={e => set('charge', e.target.value)}
        className={inputClass} style={inputStyle} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={form.court_date} onChange={e => set('court_date', e.target.value)}
          className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
        <input placeholder="Court location" value={form.court_location} onChange={e => set('court_location', e.target.value)}
          className={inputClass} style={inputStyle} />
      </div>
      <textarea rows={2} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)}
        className={`${inputClass} resize-none`} style={inputStyle} />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366f1' }}>
          Save Case
        </button>
      </div>
    </div>
  )
}

function CaseCard({ c, incidentCount, onEdit, onDelete, canEdit, canDelete }) {
  const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.closed
  const daysLeft = c.court_date ? differenceInDays(new Date(c.court_date), new Date()) : null
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14

  return (
    <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: isUrgent ? 'rgba(239,68,68,0.3)' : '#2a2d3a' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ ...s, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {c.status}
          </span>
          {c.case_number && (
            <span className="text-xs font-mono text-slate-400">{c.case_number}</span>
          )}
          {incidentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
              <FileText size={10} />
              {incidentCount} incident{incidentCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {canEdit && (
            <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors">
              <Pencil size={13} />
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-100 mb-2">{c.charge}</p>

      {c.court_date && (
        <div className="flex items-center flex-wrap gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-500" />
            <span className="text-xs text-slate-300">{format(new Date(c.court_date), 'd MMMM yyyy')}</span>
          </div>
          {c.court_location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-slate-500" />
              <span className="text-xs text-slate-400">{c.court_location}</span>
            </div>
          )}
          {daysLeft !== null && (
            <span className={`text-xs font-semibold ${daysLeft < 0 ? 'text-slate-600' : isUrgent ? 'text-red-400' : 'text-slate-400'}`}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
            </span>
          )}
        </div>
      )}

      {c.notes && <p className="text-xs text-slate-500 line-clamp-2">{c.notes}</p>}
    </div>
  )
}

export default function CaseStatus() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const [cases, setCases] = useState([])
  const [incidentCounts, setIncidentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('cases').select('*').order('court_date', { nullsFirst: false }),
      supabase.from('incidents').select('linked_case_id').not('linked_case_id', 'is', null),
    ]).then(([casesRes, incRes]) => {
      setCases(casesRes.data ?? [])
      const counts = {}
      ;(incRes.data ?? []).forEach(i => {
        counts[i.linked_case_id] = (counts[i.linked_case_id] ?? 0) + 1
      })
      setIncidentCounts(counts)
      setLoading(false)
    })
  }, [user])

  const addCase = async (form) => {
    const { data } = await supabase.from('cases').insert({ ...form, user_id: user.id }).select().single()
    if (data) { setCases(c => sortCases([data, ...c])); setAdding(false) }
  }

  const saveCase = async (id, form) => {
    const { data } = await supabase.from('cases').update(form).eq('id', id).select().single()
    if (data) { setCases(c => sortCases(c.map(x => x.id === id ? data : x))); setEditing(null) }
  }

  const deleteCase = async (id) => {
    await supabase.from('cases').delete().eq('id', id)
    setCases(c => c.filter(x => x.id !== id))
    setConfirmDel(null)
  }

  const sortCases = (arr) =>
    [...arr].sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      if (so !== 0) return so
      if (!a.court_date && !b.court_date) return 0
      if (!a.court_date) return 1
      if (!b.court_date) return -1
      return new Date(a.court_date) - new Date(b.court_date)
    })

  const q = search.toLowerCase().trim()
  const filtered = q
    ? cases.filter(c =>
        c.charge?.toLowerCase().includes(q) ||
        c.case_number?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q) ||
        c.court_location?.toLowerCase().includes(q)
      )
    : cases

  const sections = [
    { key: 'active',  label: 'Active',  items: filtered.filter(c => c.status === 'active') },
    { key: 'pending', label: 'Pending', items: filtered.filter(c => c.status === 'pending') },
    { key: 'closed',  label: 'Closed',  items: filtered.filter(c => c.status === 'closed') },
  ].filter(s => s.items.length > 0)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Cases</h1>
        {can.manageCases && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#6366f1' }}>
            <Plus size={16} /> Add Case
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input type="text" placeholder="Search cases…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
      </div>

      {adding && (
        <div className="rounded-xl p-4 border mb-3" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
          <div className="flex justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">New Case</h3>
            <button onClick={() => setAdding(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
          </div>
          <CaseForm onSave={addCase} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <p className="text-slate-400 text-sm">No cases added yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <p className="text-slate-400 text-sm">No cases match your search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map(({ key, label, items }) => (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: STATUS_STYLE[key]?.text ?? '#94a3b8' }}>
                {label} · {items.length}
              </p>
              <div className="flex flex-col gap-2">
                {items.map(c => {
                  if (editing === c.id) return (
                    <div key={c.id} className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
                      <div className="flex justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-100">Edit Case</h3>
                        <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
                      </div>
                      <CaseForm initial={c} onSave={(form) => saveCase(c.id, form)} onCancel={() => setEditing(null)} />
                    </div>
                  )
                  return (
                    <CaseCard
                      key={c.id}
                      c={c}
                      incidentCount={incidentCounts[c.id] ?? 0}
                      onEdit={() => setEditing(c.id)}
                      onDelete={() => setConfirmDel(c.id)}
                      canEdit={can.manageCases}
                      canDelete={can.delete}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirmDel} title="Delete Case" message="Delete this case permanently? Any incidents linked to it will be unlinked."
        confirmLabel="Delete" onConfirm={() => deleteCase(confirmDel)} onCancel={() => setConfirmDel(null)} />
    </div>
  )
}
