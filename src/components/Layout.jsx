import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, Users, Briefcase, FileText, Settings, LogOut, Shield, UserCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions, ROLE_LABELS, ROLE_STYLES } from '../hooks/usePermissions'

const navItems = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/people',    label: 'People',    icon: Users },
  { to: '/cases',     label: 'Cases',     icon: Briefcase },
  { to: '/documents', label: 'Documents', icon: FileText },
]

function NavItem({ to, label, icon: Icon, exact, mobile }) {
  const base = mobile
    ? 'flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium transition-colors'
    : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full'
  const active = 'text-indigo-400 bg-indigo-500/10'
  const inactive = 'text-slate-400 hover:text-slate-200 hover:bg-white/5'

  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
    >
      <Icon size={mobile ? 20 : 18} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  const { userCode, signOut } = useAuth()
  const { role, can } = usePermissions()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const rs = ROLE_STYLES[role] ?? ROLE_STYLES.viewer

  return (
    <div className="flex min-h-screen" style={{ background: '#0f1117' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r shrink-0 sticky top-0 h-screen"
        style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
        <div className="px-4 py-5 border-b" style={{ borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-indigo-400" />
            <span className="font-semibold text-slate-100 text-sm">Incident Tracker</span>
          </div>
          {role && (
            <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: rs.bg, color: rs.text }}>
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(item => <NavItem key={item.to} {...item} />)}
          <NavItem to="/settings" label="Settings" icon={Settings} />
          {can.viewAdmin && <NavItem to="/admin" label="Admin" icon={Shield} />}
        </nav>

        <div className="px-2 py-3 border-t" style={{ borderColor: '#2a2d3a' }}>
          <Link to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors w-full mb-0.5">
            <UserCircle size={18} />
            <span className="font-mono text-xs">#{userCode ?? '—'}</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
          style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-400" />
            <span className="font-semibold text-slate-100 text-sm">Incident Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/settings" className="text-slate-400 hover:text-slate-200 p-1">
              <UserCircle size={18} />
            </Link>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400 p-1">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t z-10 flex"
          style={{ background: '#0f1117', borderColor: '#2a2d3a' }}>
          {navItems.map(item => <NavItem key={item.to} {...item} mobile />)}
          <NavItem to="/settings" label="Settings" icon={Settings} mobile />
          {can.viewAdmin && <NavItem to="/admin" label="Admin" icon={Shield} mobile />}
        </nav>
      </div>
    </div>
  )
}
