import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShieldOff, Ban, Settings2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../../hooks/usePermissions'

export default function AdminOverview() {
  const { can, isAdmin } = usePermissions()
  const [stats, setStats] = useState({ active: 0, suspended: 0, blocked: 0, byRole: {} })
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase.from('users').select('role, status').neq('status', 'pending')
      .then(({ data }) => {
        if (!data) return
        const s = { active: 0, suspended: 0, blocked: 0, byRole: {} }
        data.forEach(u => {
          if (u.status === 'active') s.active++
          else if (u.status === 'suspended') s.suspended++
          else if (u.status === 'blocked') s.blocked++
          s.byRole[u.role] = (s.byRole[u.role] ?? 0) + 1
        })
        setStats(s)
      })

    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active').not('deletion_requested_at', 'is', null),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active').not('password_reset_requested_at', 'is', null),
    ]).then(([reg, del, pw]) => {
      setPendingCount((reg.count ?? 0) + (del.count ?? 0) + (pw.count ?? 0))
    })
  }, [])

  const cards = [
    ...(can.manageUsers ? [
      { to: '/admin/users', icon: Users, label: 'User Management', desc: 'Approve registrations, create and edit users', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
      { to: '/admin/suspend', icon: ShieldOff, label: 'Suspend / Ban', desc: 'Suspend or ban users, add IP and email blocks', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
      { to: '/admin/bans', icon: Ban, label: 'Ban List', desc: 'Live view of all active bans with edit and remove', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
    ] : []),
    ...(isAdmin ? [
      { to: '/admin/settings', icon: Settings2, label: 'App Settings', desc: 'Registration, feature flags, help & contact info', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    ] : []),
  ]

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-4">Admin Panel</h1>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: 'Active', val: stats.active, color: '#34d399' },
          { label: 'Suspended', val: stats.suspended, color: '#eab308', hide: stats.suspended === 0 },
          { label: 'Blocked', val: stats.blocked, color: '#f87171', hide: stats.blocked === 0 },
          { label: 'Pending', val: pendingCount, color: pendingCount > 0 ? '#eab308' : '#475569' },
        ].filter(s => !s.hide).map(s => (
          <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: s.color }}>
            <span>{s.val}</span>
            <span className="text-slate-500 font-normal">{s.label}</span>
          </div>
        ))}
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = stats.byRole[role] ?? 0
          if (!count) return null
          const s = ROLE_STYLES[role]
          return (
            <div key={role} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
              <span style={{ color: s.text }} className="font-semibold">{count}</span>
              <span className="text-slate-500">{label}</span>
            </div>
          )
        })}
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <Link to="/admin/users"
          className="flex items-center gap-3 p-3 rounded-xl border mb-5 hover:border-red-500/40 transition-colors"
          style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-500">Go to User Management →</p>
          </div>
        </Link>
      )}

      {/* Quick link cards */}
      <div className="flex flex-col gap-3">
        {cards.map(card => (
          <Link key={card.to} to={card.to}
            className="flex items-center gap-4 p-4 rounded-xl border hover:border-slate-600 transition-colors"
            style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: card.bg }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{card.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
