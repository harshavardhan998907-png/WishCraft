import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { hasAnyPermission } from '../../lib/permissions'

export function CreatorRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  if (!hasAnyPermission(role, ['creator_templates:manage', 'creator_analytics:access', 'creator_profile:manage'])) return <Navigate to="/unauthorized" replace />

  return children
}
