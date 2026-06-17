import { useEffect, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'
import IncidentForm from '../components/IncidentForm'

export default function EditIncident() {
  const { id } = useParams()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    supabase.from('incidents').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) setFetchError(true)
        else setIncident(data)
      })
  }, [id])

  if (!can.edit) return <Navigate to={`/incidents/${id}`} replace />

  if (fetchError) return (
    <div className="p-4 max-w-2xl mx-auto">
      <p className="text-slate-400 text-sm">Incident not found.</p>
    </div>
  )

  if (!incident) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleSubmit = async (form) => {
    setLoading(true); setError('')
    const { error } = await supabase.from('incidents')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
    setLoading(false)
    if (error) setError(error.message)
    else navigate(`/incidents/${id}`)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-100">Edit Incident</h1>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm text-red-300 border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}
      <div className="rounded-xl p-4 border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <IncidentForm initial={incident} onSubmit={handleSubmit} loading={loading} submitLabel="Update Incident" />
      </div>
    </div>
  )
}
