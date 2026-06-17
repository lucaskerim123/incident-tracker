import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/usePermissions'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import AddIncident from './pages/AddIncident'
import EditIncident from './pages/EditIncident'
import People from './pages/People'
import CaseStatus from './pages/CaseStatus'
import Documents from './pages/Documents'
import Settings from './pages/Settings'

function RequireAdmin({ children }) {
  const { can } = usePermissions()
  if (!can.manageUsers) return <Navigate to="/" replace />
  return children
}

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1117' }}>
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/new" element={<AddIncident />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="incidents/:id/edit" element={<EditIncident />} />
        <Route path="people" element={<People />} />
        <Route path="cases" element={<CaseStatus />} />
        <Route path="documents" element={<Documents />} />
        <Route path="settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
