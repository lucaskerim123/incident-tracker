import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import IncidentCard from '../components/IncidentCard'
import IncidentDrawer from '../components/IncidentDrawer'

const FILTERS = [
  { value: 'all',           label: 'All' },
  { value: 'legal',         label: 'Legal' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'police',        label: 'Police' },
  { value: 'court',         label: 'Court' },
  { value: 'avo',           label: 'AVO' },
  { value: 'other',         label: 'Other' },
]

export default function Incidents() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('incidents').select('*').order('date', { ascending: false })
      .then(({ data }) => {
        setIncidents(data ?? [])
        setLoading(false)
      })
  }, [user])

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from('incidents').update({ status: newStatus }).eq('id', id)
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))
  }

  useEffect(() => {
    let list = incidents
    if (category !== 'all') list = list.filter(i => i.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.reference_number?.toLowerCase().includes(q) ||
        i.people_involved?.some(p => p.toLowerCase().includes(q))
      )
    }
    if (dateFrom) list = list.filter(i => i.date >= dateFrom)
    if (dateTo) list = list.filter(i => i.date <= dateTo)
    setFiltered(list)
  }, [incidents, search, category, dateFrom, dateTo])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Incidents</h1>
        {can.add && (
          <button onClick={() => navigate('/incidents/new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#6366f1' }}>
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search incidents…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
            style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`px-3 rounded-lg border transition-colors ${showFilters ? 'border-indigo-500 text-indigo-400' : 'border-[#2a2d3a] text-slate-400 hover:text-slate-200'}`}
          style={{ background: '#1a1d27' }}>
          <Filter size={16} />
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setCategory(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${category === f.value ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            style={category === f.value ? { background: '#6366f1' } : { background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      {showFilters && (
        <div className="flex gap-2 mb-3">
          {[['From', dateFrom, setDateFrom], ['To', dateTo, setDateTo]].map(([label, val, set]) => (
            <div key={label} className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">{label}</label>
              <input type="date" value={val} onChange={e => set(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-xs text-slate-100 border outline-none focus:border-indigo-500"
                style={{ background: '#1a1d27', borderColor: '#2a2d3a', colorScheme: 'dark' }} />
            </div>
          ))}
          <div className="flex items-end">
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border"
              style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <p className="text-slate-400 text-sm">
            {incidents.length === 0 ? 'No incidents logged yet.' : 'No incidents match your search.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 mb-1">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map(i => (
            <IncidentCard
              key={i.id}
              incident={i}
              onStatusChange={can.edit ? handleStatusChange : null}
              onClick={() => setSelectedId(i.id)}
            />
          ))}
        </div>
      )}

      {can.add && (
        <button onClick={() => navigate('/incidents/new')}
          className="md:hidden fixed bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10"
          style={{ background: '#6366f1' }}>
          <Plus size={22} className="text-white" />
        </button>
      )}

      {selectedId && (
        <IncidentDrawer
          incidentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
