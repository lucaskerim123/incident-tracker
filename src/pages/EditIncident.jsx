import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import IncidentForm from '../components/IncidentForm'

export default function EditIncident() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('incidents').select('*').eq('id', id).single()
      .then(({ data }) => setIncident(data))
  }, [id])

  const handleSubmit = async (form) => {
    setLoading(true); setError('')
    const { error } = await supabase.from('incidents')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
    setLoading(false)
    if (error) setError(error.message)
    else navigate(`/incidents/${id}`)
  }

  if (!incident) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

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
