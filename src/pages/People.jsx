import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, UserCheck, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

function PersonRow({ person, onSave, onDelete, onConfirm, canManage }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: person.name, role: person.role ?? '', dob: person.dob ?? '', notes: person.notes ?? '' })
  const [confirmDel, setConfirmDel] = useState(false)

  const save = () => { onSave(person.id, form); setEditing(false) }

  if (editing) return (
    <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
      <div className="flex flex-col gap-2">
        <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className={inputClass} style={inputStyle} />
        <input placeholder="Role (e.g. Former partner, Police officer)" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          className={inputClass} style={inputStyle} />
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Date of birth</label>
          <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
            className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
        <textarea rows={2} placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className={`${inputClass} resize-none`} style={inputStyle} />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
          <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366f1' }}>
            <Check size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  )

  const isPending = person.status === 'awaiting_review'

  return (
    <div className={`rounded-xl p-4 border ${isPending ? 'opacity-80' : ''}`}
      style={{ background: '#1a1d27', borderColor: isPending ? 'rgba(234,179,8,0.3)' : '#2a2d3a' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-slate-100 text-sm">{person.name}</p>
            {isPending && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
                Awaiting Review
              </span>
            )}
          </div>
          {person.role && <p className="text-xs text-slate-400 mt-0.5">{person.role}</p>}
          {person.dob && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Calendar size={10} />
              DOB: {format(parseISO(person.dob), 'd MMM yyyy')}
            </p>
          )}
          {person.notes && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{person.notes}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          {canManage && isPending && (
            <button onClick={() => onConfirm(person.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Confirm person">
              <UserCheck size={13} /> Confirm
            </button>
          )}
          {canManage && (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog open={confirmDel} title="Remove Person" message={`Remove ${person.name} from the people list?`}
        confirmLabel="Remove" onConfirm={() => onDelete(person.id)} onCancel={() => setConfirmDel(false)} />
    </div>
  )
}

export default function People() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', role: '', dob: '', notes: '' })
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('people').select('*').order('name')
      .then(({ data }) => { setPeople(data ?? []); setLoading(false) })
  }, [user])

  const addPerson = async () => {
    if (!newPerson.name.trim()) return
    const { data } = await supabase.from('people')
      .insert({ ...newPerson, user_id: user.id, status: 'confirmed' })
      .select().single()
    if (data) {
      setPeople(p => [...p, data].sort((a, b) => a.name.localeCompare(b.name)))
      setAdding(false)
      setNewPerson({ name: '', role: '', dob: '', notes: '' })
    }
  }

  const savePerson = async (id, form) => {
    const { data } = await supabase.from('people').update(form).eq('id', id).select().single()
    if (data) setPeople(p => p.map(x => x.id === id ? data : x))
  }

  const confirmPerson = async (id) => {
    await supabase.from('people').update({ status: 'confirmed' }).eq('id', id)
    setPeople(p => p.map(x => x.id === id ? { ...x, status: 'confirmed' } : x))
  }

  const deletePerson = async (id) => {
    await supabase.from('people').delete().eq('id', id)
    setPeople(p => p.filter(x => x.id !== id))
  }

  const q = search.toLowerCase().trim()
  const filtered = q
    ? people.filter(p => p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q))
    : people

  const confirmed = filtered.filter(p => p.status !== 'awaiting_review')
  const awaiting = filtered.filter(p => p.status === 'awaiting_review')

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">People</h1>
        {can.managePeople && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#6366f1' }}>
            <Plus size={16} /> Add Person
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input type="text" placeholder="Search people…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
      </div>

      {adding && (
        <div className="rounded-xl p-4 border mb-3" style={{ background: '#1a1d27', borderColor: '#6366f1', borderWidth: 1.5 }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-100">New Person</h3>
            <button onClick={() => setAdding(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
          </div>
          <div className="flex flex-col gap-2">
            <input placeholder="Name *" value={newPerson.name} onChange={e => setNewPerson(f => ({ ...f, name: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <input placeholder="Role" value={newPerson.role} onChange={e => setNewPerson(f => ({ ...f, role: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date of birth</label>
              <input type="date" value={newPerson.dob} onChange={e => setNewPerson(f => ({ ...f, dob: e.target.value }))}
                className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <textarea rows={2} placeholder="Notes" value={newPerson.notes} onChange={e => setNewPerson(f => ({ ...f, notes: e.target.value }))}
              className={`${inputClass} resize-none`} style={inputStyle} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-400">Cancel</button>
              <button onClick={addPerson} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366f1' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <p className="text-slate-400 text-sm">No people added yet.</p>
        </div>
      ) : (
        <>
          {awaiting.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
                Awaiting Review · {awaiting.length}
              </p>
              <div className="flex flex-col gap-2">
                {awaiting.map(p => (
                  <PersonRow key={p.id} person={p} onSave={savePerson} onDelete={deletePerson}
                    onConfirm={confirmPerson} canManage={can.managePeople} />
                ))}
              </div>
            </div>
          )}

          {confirmed.length > 0 && (
            <div>
              {awaiting.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Confirmed · {confirmed.length}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {confirmed.map(p => (
                  <PersonRow key={p.id} person={p} onSave={savePerson} onDelete={deletePerson}
                    onConfirm={confirmPerson} canManage={can.managePeople} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">No people match your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
