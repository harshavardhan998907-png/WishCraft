import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'

interface AuthStore {
  user: User | null
  profile: Profile | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}))
