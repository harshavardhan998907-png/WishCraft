import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>
  if (!user) {
    const intendedPath = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(intendedPath)}`} replace />
  }
  if (role !== 'admin') return <Navigate to="/unauthorized" replace />

  return children
}
