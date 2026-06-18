import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, X, Search, UserCheck, Calendar, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

const emptyForm = {
  name: '', role: '', dob: '',
  bio: '',
  labelsStr: '', associateLabelsStr: '',
  legal_update: '', legal_notes: '', profile_url: '', notes: '',
}

function PersonCard({ person, onDelete, onConfirm, canManage, navigate }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const isPending = person.status === 'awaiting_review'
  const firstLabel = person.labels?.[0] || person.role

  return (
    <div
      className="rounded-xl p-4 border cursor-pointer hover:border-indigo-500/30 transition-colors"
      style={{ background: '#1a1d27', borderColor: isPending ? 'rgba(234,179,8,0.3)' : '#2a2d3a' }}
      onClick={() => navigate(`/people/${person.id}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-100 text-sm">{person.name}</p>
            {isPending && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
                Awaiting Review
              </span>
            )}
          </div>
          {person.dob && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Calendar size={10} /> DOB: {format(parseISO(person.dob), 'd MMM yyyy')}
            </p>
          )}
          {firstLabel && (
            <span className="mt-1.5 inline-block text-[11px] px-2 py-0.5 rounded-md font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              {firstLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {canManage && isPending && (
            <button onClick={() => onConfirm(person.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors">
              <UserCheck size={13} /> Confirm
            </button>
          )}
          {canManage && (
            <button onClick={() => setConfirmDel(true)}
              className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
          <ChevronRight size={14} className="text-slate-600 ml-1" />
        </div>
      </div>
      <ConfirmDialog open={confirmDel} title="Remove Person"
        message={`Remove ${person.name} from the people list?`}
        confirmLabel="Remove" onConfirm={() => onDelete(person.id)}
        onCancel={() => setConfirmDel(false)} />
    </div>
  )
}

export default function People() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newPerson, setNewPerson] = useState(emptyForm)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('people').select('*').order('name')
      .then(({ data }) => { setPeople(data ?? []); setLoading(false) })
  }, [user])

  const addPerson = async () => {
    if (!newPerson.name.trim()) return
    const labels = newPerson.labelsStr.split(',').map(s => s.trim()).filter(Boolean)
    const associate_labels = newPerson.associateLabelsStr.split(',').map(s => s.trim()).filter(Boolean)
    const { data } = await supabase.from('people')
      .insert({
        name: newPerson.name.trim(),
        role: newPerson.role.trim() || null,
        dob: newPerson.dob || null,
        bio: newPerson.bio.trim() || null,
        labels,
        associate_labels,
        legal_update: newPerson.legal_update.trim() || null,
        legal_notes: newPerson.legal_notes.trim() || null,
        profile_url: newPerson.profile_url.trim() || null,
        notes: newPerson.notes.trim() || null,
        user_id: user.id,
        status: 'confirmed',
      })
      .select().single()
    if (data) {
      setPeople(p => [...p, data].sort((a, b) => a.name.localeCompare(b.name)))
      setAdding(false)
      setNewPerson(emptyForm)
    }
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
    ? people.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.labels?.some(l => l.toLowerCase().includes(q))
      )
    : people

  const confirmed = filtered.filter(p => p.status !== 'awaiting_review')
  const awaiting = filtered.filter(p => p.status === 'awaiting_review')

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">People</h1>
        {can.managePeople && (
          <button onClick={() => setAdding(v => !v)}
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
            <input placeholder="Name *" value={newPerson.name}
              onChange={e => setNewPerson(f => ({ ...f, name: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <input placeholder="Role (short primary description)" value={newPerson.role}
              onChange={e => setNewPerson(f => ({ ...f, role: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date of birth</label>
              <input type="date" value={newPerson.dob}
                onChange={e => setNewPerson(f => ({ ...f, dob: e.target.value }))}
                className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Bio / Overview</label>
              <textarea rows={3} placeholder="General overview or summary…"
                value={newPerson.bio} onChange={e => setNewPerson(f => ({ ...f, bio: e.target.value }))}
                className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Labels <span className="text-slate-600">(comma-separated)</span>
              </label>
              <input placeholder="e.g. Former partner, Mother of Evelyn" value={newPerson.labelsStr}
                onChange={e => setNewPerson(f => ({ ...f, labelsStr: e.target.value }))}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Associate Labels <span className="text-slate-600">(comma-separated)</span>
              </label>
              <input placeholder="e.g. Central figure, Witness" value={newPerson.associateLabelsStr}
                onChange={e => setNewPerson(f => ({ ...f, associateLabelsStr: e.target.value }))}
                className={inputClass} style={inputStyle} />
            </div>
            <input placeholder="Legal update (e.g. AVO dismissed)" value={newPerson.legal_update}
              onChange={e => setNewPerson(f => ({ ...f, legal_update: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Legal notes (private)</label>
              <textarea rows={2} placeholder="Private legal strategy / lawyer notes…"
                value={newPerson.legal_notes} onChange={e => setNewPerson(f => ({ ...f, legal_notes: e.target.value }))}
                className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
            <input placeholder="External profile URL" value={newPerson.profile_url}
              onChange={e => setNewPerson(f => ({ ...f, profile_url: e.target.value }))}
              className={inputClass} style={inputStyle} />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mental health reference (private)</label>
              <textarea rows={3} placeholder="Private mental health reference…"
                value={newPerson.notes} onChange={e => setNewPerson(f => ({ ...f, notes: e.target.value }))}
                className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-400">Cancel</button>
              <button onClick={addPerson}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#6366f1' }}>Add</button>
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
                  <PersonCard key={p.id} person={p} onDelete={deletePerson}
                    onConfirm={confirmPerson} canManage={can.managePeople} navigate={navigate} />
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
                  <PersonCard key={p.id} person={p} onDelete={deletePerson}
                    onConfirm={confirmPerson} canManage={can.managePeople} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && search && (
            <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">No people match your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
