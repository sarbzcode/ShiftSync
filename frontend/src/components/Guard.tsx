import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface GuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireEmployee?: boolean
}

export default function Guard({ children, requireAdmin, requireEmployee }: GuardProps) {
  const { isAuthenticated, isAdmin, isEmployee, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/work" replace />
  }

  if (requireEmployee && !isEmployee) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
