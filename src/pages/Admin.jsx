import { Outlet, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, ShieldOff, Ban, Settings2, SlidersHorizontal, Clock } from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const { can, isAdmin } = usePermissions()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('pending_gdrive_deletions')
      .select('*', { count: 'exact', head: true })
      .eq('dismissed', false)
      .then(({ count }) => setPendingCount(count ?? 0))
  }, [isAdmin])

  const items = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    ...(can.manageUsers ? [
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/suspend', label: 'Suspend / Ban', icon: ShieldOff },
      { to: '/admin/bans', label: 'Ban List', icon: Ban },
    ] : []),
    ...(isAdmin ? [
      { to: '/admin/pending', label: 'Pending Approvals', icon: Clock, badge: pendingCount },
      { to: '/admin/roles',    label: 'Role Permissions', icon: SlidersHorizontal },
      { to: '/admin/settings', label: 'App Settings',     icon: Settings2 },
    ] : []),
  ]

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-44 border-r shrink-0 py-4 px-2 sticky top-0 h-screen"
        style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-3 mb-2">Admin</p>
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full mb-0.5 ${
                isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }>
            <item.icon size={15} />
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile horizontal tab bar */}
        <nav className="md:hidden flex gap-0.5 overflow-x-auto border-b px-2 py-1.5 shrink-0"
          style={{ borderColor: '#2a2d3a', background: '#0f1117' }}>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
                }`
              }>
              <item.icon size={13} />
              {item.label}
              {item.badge > 0 && (
                <span className="text-[9px] font-bold px-1 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
