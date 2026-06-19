import { format } from 'date-fns'

export default function IncidentCard({ incident, onStatusChange, onClick }) {
  const people = incident.people_involved ?? []

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 border hover:border-indigo-500/40 transition-all group"
      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-medium text-slate-100 text-sm leading-snug group-hover:text-indigo-300 transition-colors flex-1 min-w-0">
          {incident.title}
        </p>
        <time className="text-xs text-slate-500 whitespace-nowrap shrink-0 mt-0.5">
          {format(new Date(incident.date), 'd MMM yyyy')}
        </time>
      </div>

      {people.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {people.slice(0, 3).map(p => (
            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              {p}
            </span>
          ))}
          {people.length > 3 && (
            <span className="text-[10px] text-slate-600">+{people.length - 3}</span>
          )}
        </div>
      )}

      {incident.outcome && (
        <p className="text-xs text-slate-500 truncate">{incident.outcome}</p>
      )}
    </button>
  )
}
