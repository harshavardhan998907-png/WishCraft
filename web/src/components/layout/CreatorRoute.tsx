import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../ui/Loader'
import { hasAnyPermission } from '../../lib/permissions'

export function CreatorRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader variant="fullPage" />
  if (!user) {
    const intendedPath = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(intendedPath)}`} replace />
  }
  if (!hasAnyPermission(role, ['creator_templates:manage', 'creator_analytics:access', 'creator_profile:manage'])) return <Navigate to="/unauthorized" replace />

  return children
}
