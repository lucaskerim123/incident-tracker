import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import CategoryBadge from './CategoryBadge'

const STATUS_STYLES = {
  documented: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  resolved:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

export default function IncidentCard({ incident }) {
  const navigate = useNavigate()
  const s = STATUS_STYLES[incident.status] ?? STATUS_STYLES.documented
  const people = incident.people_involved ?? []

  return (
    <button
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="w-full text-left rounded-xl p-4 border hover:border-indigo-500/40 transition-all group"
      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <CategoryBadge category={incident.category} size="xs" />
            <span style={{ background: s.bg, color: s.text, padding: '2px 6px', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
              {incident.status}
            </span>
            {incident.reference_number && (
              <span className="text-xs text-slate-500 font-mono">{incident.reference_number}</span>
            )}
          </div>
          <p className="font-medium text-slate-100 text-sm leading-snug mb-1 truncate">{incident.title}</p>
          <p className="text-xs text-slate-400 line-clamp-2">{incident.description}</p>
          {people.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {people.slice(0, 4).map(p => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                  {p}
                </span>
              ))}
              {people.length > 4 && <span className="text-xs text-slate-500">+{people.length - 4} more</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <time className="text-xs text-slate-500 whitespace-nowrap">
            {format(new Date(incident.date), 'd MMM yyyy')}
          </time>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </button>
  )
}
