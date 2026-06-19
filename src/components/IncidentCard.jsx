import { format } from 'date-fns'

const STATUS_STYLES = {
  documented: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  resolved:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

export default function IncidentCard({ incident, onClick }) {
  const s = STATUS_STYLES[incident.status] ?? STATUS_STYLES.documented

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 border hover:border-indigo-500/40 transition-all group"
      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
    >
      {/* ID · Date · Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-600">
            #{incident.incident_number ?? '—'}
          </span>
          <span style={{ background: s.bg, color: s.text, padding: '2px 7px', fontSize: 10, borderRadius: 5, fontWeight: 600 }}>
            {incident.status ?? 'documented'}
          </span>
        </div>
        <time className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          {incident.date ? format(new Date(incident.date), 'd MMM yyyy') : '—'}
        </time>
      </div>

      {/* Title */}
      <p className="font-semibold text-slate-100 text-sm leading-snug mb-1.5 group-hover:text-indigo-300 transition-colors">
        {incident.title}
      </p>

      {/* Plea */}
      {incident.plea && (
        <p className="text-xs mb-1.5">
          <span className="text-slate-600">Plea: </span>
          <span className="text-slate-400 capitalize">{incident.plea}</span>
        </p>
      )}

      {/* Brief entry — 2 lines max */}
      {incident.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {incident.description}
        </p>
      )}
    </button>
  )
}
