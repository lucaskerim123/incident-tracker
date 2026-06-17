import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import CaseBanner from '../components/CaseBanner'
import IncidentCard from '../components/IncidentCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [recent, setRecent] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('cases').select('*').order('court_date'),
      supabase.from('incidents').select('*').order('date', { ascending: false }).limit(5),
      supabase.from('incidents').select('id, status, date'),
    ]).then(([casesRes, recentRes, allRes]) => {
      setCases(casesRes.data ?? [])
      setRecent(recentRes.data ?? [])
      const all = allRes.data ?? []
      const now = new Date()
      setStats({
        total: all.length,
        pending: all.filter(i => i.status === 'pending').length,
        thisMonth: all.filter(i => {
          const d = new Date(i.date)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length,
      })
      setLoading(false)
    }).catch(() => { setError(true); setLoading(false) })
  }, [user])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Private incident & case tracker</p>
        </div>
        {can.add && (
          <button onClick={() => navigate('/incidents/new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: '#6366f1' }}>
            <Plus size={16} />
            Add Incident
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <AlertCircle size={24} className="text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Failed to load dashboard.</p>
          <button onClick={() => { setError(false); setLoading(true) }}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
            Retry
          </button>
        </div>
      ) : (
        <>
          <CaseBanner cases={cases} />

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Pending', value: stats.pending, warn: stats.pending > 0 },
              { label: 'This Month', value: stats.thisMonth },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
                <p className={`text-2xl font-bold ${s.warn ? 'text-amber-400' : 'text-slate-100'}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-300">Recent Incidents</h2>
            </div>
            <button onClick={() => navigate('/incidents')} className="text-xs text-indigo-400 hover:text-indigo-300">
              View all
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-xl p-8 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">No incidents logged yet.</p>
              {can.add && (
                <button onClick={() => navigate('/incidents/new')}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                  Add your first incident →
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map(i => <IncidentCard key={i.id} incident={i} />)}
            </div>
          )}
        </>
      )}

      {can.add && (
        <button onClick={() => navigate('/incidents/new')}
          className="md:hidden fixed bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10"
          style={{ background: '#6366f1' }}>
          <Plus size={22} className="text-white" />
        </button>
      )}
    </div>
  )
}
