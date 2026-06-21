import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/usePermissions'
import { RolePermissionsProvider } from './context/RolePermissionsContext'
import Layout from './components/Layout'
import PendingApproval from './components/PendingApproval'
import Suspended from './components/Suspended'
import Banned from './components/Banned'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import AddIncident from './pages/AddIncident'
import EditIncident from './pages/EditIncident'
import People from './pages/People'
import PersonDetail from './pages/PersonDetail'
import ChargesAVO from './pages/ChargesAVO'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import AdminOverview from './pages/admin/Overview'
import UserManagement from './pages/admin/UserManagement'
import SuspendBan from './pages/admin/SuspendBan'
import BanList from './pages/admin/BanList'
import AdminSettings from './pages/admin/AdminSettings'
import RolePermissions from './pages/admin/RolePermissions'

function RequireViewAdmin({ children }) {
  const { can } = usePermissions()
  if (!can.viewAdmin) return <Navigate to="/" replace />
  return children
}

function RequireAuth({ children }) {
  const { session, loading, userStatus } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1117' }}>
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  if (userStatus === 'pending') return <PendingApproval />
  if (userStatus === 'suspended') return <Suspended />
  if (userStatus === 'blocked') return <Banned />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/new" element={<AddIncident />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="incidents/:id/edit" element={<EditIncident />} />
        <Route path="people" element={<People />} />
        <Route path="people/:id" element={<PersonDetail />} />
        <Route path="charges" element={<ChargesAVO />} />
        <Route path="documents" element={<Documents />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<RequireViewAdmin><Admin /></RequireViewAdmin>}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="suspend" element={<SuspendBan />} />
          <Route path="bans" element={<BanList />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="roles" element={<RolePermissions />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RolePermissionsProvider>
          <AppRoutes />
        </RolePermissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
