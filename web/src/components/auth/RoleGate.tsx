import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/roles'

interface RoleGateProps {
  allow: readonly UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { role, loading } = useAuth()

  if (loading) return null
  if (!allow.includes(role)) return fallback

  return children
}
