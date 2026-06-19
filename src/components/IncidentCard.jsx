import { format } from 'date-fns'
import CategoryBadge from './CategoryBadge'

const SEVERITY_DOTS = {
  low:      '#64748b',
  medium:   '#eab308',
  high:     '#f97316',
  critical: '#ef4444',
}

const STATUS_STYLES = {
  documented: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  resolved:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
}

const STATUS_CYCLE = { documented: 'pending', pending: 'resolved', resolved: 'documented' }

export default function IncidentCard({ incident, onStatusChange, onClick }) {
  const people = incident.people_involved ?? []
  const severityColor = SEVERITY_DOTS[incident.severity] ?? SEVERITY_DOTS.medium
  const s = STATUS_STYLES[incident.status] ?? STATUS_STYLES.documented

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3.5 border hover:border-indigo-500/40 transition-all group"
      style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}
    >
      <div className="flex items-start gap-3">
        {/* Severity bar */}
        <div className="w-0.5 self-stretch rounded-full mt-0.5 shrink-0" style={{ background: severityColor }} />

        <div className="flex-1 min-w-0">
          {/* Top row: badges + date */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CategoryBadge category={incident.category} size="xs" />
              {onStatusChange ? (
                <button
                  onClick={e => { e.stopPropagation(); onStatusChange(incident.id, STATUS_CYCLE[incident.status] ?? 'documented') }}
                  style={{ background: s.bg, color: s.text, padding: '2px 6px', fontSize: 10, borderRadius: 5, fontWeight: 600, cursor: 'pointer' }}
                  title="Click to cycle status"
                >
                  {incident.status}
                </button>
              ) : (
                <span style={{ background: s.bg, color: s.text, padding: '2px 6px', fontSize: 10, borderRadius: 5, fontWeight: 600 }}>
                  {incident.status}
                </span>
              )}
              {incident.reference_number && (
                <span className="text-[10px] text-slate-600 font-mono">{incident.reference_number}</span>
              )}
            </div>
            <time className="text-xs text-slate-500 whitespace-nowrap shrink-0">
              {format(new Date(incident.date), 'd MMM yyyy')}
            </time>
          </div>

          {/* Title */}
          <p className="font-medium text-slate-100 text-sm leading-snug mb-2 group-hover:text-indigo-300 transition-colors">{incident.title}</p>

          {/* People tags */}
          {people.length > 0 && (
            <div className="flex gap-1 flex-wrap">
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
        </div>
      </div>
    </button>
  )
}
