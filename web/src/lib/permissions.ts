import type { Permission, UserRole } from '../types/roles'

export const validRoles: readonly UserRole[] = ['user', 'admin', 'moderator', 'creator']

export const defaultRole: UserRole = 'user'

export const permissionsByRole: Record<UserRole, readonly Permission[]> = {
  user: ['wishes:create', 'wishes:manage_own', 'media:upload', 'dashboard:access', 'payments:create'],
  admin: [
    'wishes:create',
    'wishes:manage_own',
    'media:upload',
    'dashboard:access',
    'payments:create',
    'templates:manage',
    'users:manage',
    'analytics:access',
    'governance:access',
    'intelligence:access',
    'ecosystem_api:manage',
    'moderation:access',
    'content:review',
    'content:hide',
    'reports:review',
    'creator_templates:manage',
    'creator_analytics:access',
    'creator_profile:manage',
  ],
  moderator: ['dashboard:access', 'content:review', 'content:hide', 'reports:review'],
  creator: ['wishes:create', 'wishes:manage_own', 'media:upload', 'dashboard:access', 'payments:create', 'creator_templates:manage', 'creator_analytics:access', 'creator_profile:manage', 'ecosystem_api:manage'],
}

export function normalizeRole(role: unknown): UserRole {
  return validRoles.includes(role as UserRole) ? (role as UserRole) : defaultRole
}

export function getPermissions(role: UserRole): readonly Permission[] {
  return permissionsByRole[role] ?? permissionsByRole[defaultRole]
}

export function hasPermission(role: UserRole, permission: Permission) {
  return getPermissions(role).includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: readonly Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission))
}
