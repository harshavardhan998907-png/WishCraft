import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../ui/Loader'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader variant="fullPage" />

  if (!user) {
    const intendedPath = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(intendedPath)}`} replace />
  }

  return children
}
