import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Guard from '../components/Guard'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Work from '../pages/Work'
import Pay from '../pages/Pay'

export default function AppRoutes() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/work" replace />
        ) : (
          <Login />
        )
      } />
      
      <Route path="/dashboard/*" element={
        <Guard requireAdmin>
          <Dashboard />
        </Guard>
      } />
      
      <Route path="/work" element={
        <Guard requireEmployee>
          <Work />
        </Guard>
      } />

      <Route path="/pay" element={
        <Guard requireEmployee>
          <Pay />
        </Guard>
      } />
      
      <Route path="/" element={
        isAuthenticated ? (
          isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/work" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
