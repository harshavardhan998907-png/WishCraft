import { hasAnyPermission, hasPermission } from '../lib/permissions'
import type { Permission } from '../types/roles'
import { useAuth } from './useAuth'

export function usePermissions() {
  const { role, permissions, loading } = useAuth()

  return {
    role,
    permissions,
    loading,
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (requiredPermissions: readonly Permission[]) => hasAnyPermission(role, requiredPermissions),
  }
}
