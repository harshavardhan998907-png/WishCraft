import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>

  if (!user) {
    const intendedPath = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(intendedPath)}`} replace />
  }

  return children
}
