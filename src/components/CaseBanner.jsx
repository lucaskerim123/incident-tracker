import { differenceInDays, format } from 'date-fns'
import { AlertTriangle, Calendar, Clock } from 'lucide-react'

export default function CaseBanner({ cases = [] }) {
  const active = cases.filter(c => c.status === 'active')
  const nextCourt = cases
    .filter(c => c.court_date && new Date(c.court_date) >= new Date())
    .sort((a, b) => new Date(a.court_date) - new Date(b.court_date))[0]

  const daysToNext = nextCourt ? differenceInDays(new Date(nextCourt.court_date), new Date()) : null

  return (
    <div className="rounded-xl p-4 border mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Case Status</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg p-3" style={{ background: '#0f1117' }}>
          <p className="text-xs text-slate-500 mb-1">Active Cases</p>
          <p className="text-2xl font-bold text-slate-100">{active.length}</p>
        </div>
        {nextCourt && (
          <div className="rounded-lg p-3 border" style={{ background: '#0f1117', borderColor: 'rgba(99,102,241,0.3)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={12} className="text-indigo-400" />
              <p className="text-xs text-indigo-300">Next Court Date</p>
            </div>
            <p className="text-sm font-semibold text-slate-100">{format(new Date(nextCourt.court_date), 'd MMM yyyy')}</p>
            <p className="text-xs text-slate-400">{nextCourt.court_location}</p>
          </div>
        )}
        {daysToNext !== null && (
          <div className="rounded-lg p-3" style={{ background: '#0f1117', borderColor: daysToNext <= 14 ? 'rgba(239,68,68,0.3)' : '#2a2d3a', borderWidth: 1 }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className={daysToNext <= 14 ? 'text-red-400' : 'text-slate-400'} />
              <p className="text-xs text-slate-400">Countdown</p>
            </div>
            <p className={`text-2xl font-bold ${daysToNext <= 14 ? 'text-red-400' : 'text-slate-100'}`}>{daysToNext}d</p>
          </div>
        )}
      </div>
      {active.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {active.map(c => (
            <span key={c.id} className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              {c.case_number ? `${c.case_number} — ` : ''}{c.charge}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
