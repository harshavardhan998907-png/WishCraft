import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'
import { defaultRole, getPermissions, normalizeRole } from '../lib/permissions'
import type { Permission, UserRole } from '../types/roles'

interface AuthStore {
  user: User | null
  profile: Profile | null
  role: UserRole
  permissions: readonly Permission[]
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  role: defaultRole,
  permissions: getPermissions(defaultRole),
  setUser: (user) => set({ user }),
  setProfile: (profile) => {
    const role = normalizeRole(profile?.role)
    set({ profile: profile ? { ...profile, role } : null, role, permissions: getPermissions(role) })
  },
}))
