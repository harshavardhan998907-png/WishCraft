import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  if (role !== 'admin') return <Navigate to="/unauthorized" replace />

  return children
}
