import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import IncidentForm from '../components/IncidentForm'

export default function AddIncident() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!can.add) return <Navigate to="/incidents" replace />

  const handleSubmit = async (form) => {
    setLoading(true); setError('')
    const { error } = await supabase.from('incidents').insert({
      ...form,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/incidents')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-100">New Incident</h1>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm text-red-300 border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <IncidentForm onSubmit={handleSubmit} loading={loading} submitLabel="Save Incident" />
      </div>
    </div>
  )
}
