import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { defaultRole, getPermissions, normalizeRole } from '../lib/permissions'
import { useAuthStore } from '../store/authStore'
import type { Profile } from '../types'

export function useAuth() {
  const { user, profile, role, permissions, setUser, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', nextUser.id).single()
    if (error) {
      console.warn('[useAuth] profile lookup failed', { userId: nextUser.id, error })
      return
    }
    setProfile({ ...(data as Profile), role: normalizeRole((data as Profile).role) })
  }, [setProfile])

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      setUser(data.user)
      await fetchProfile(data.user)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      void fetchProfile(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [fetchProfile, setUser])

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw new Error(error.message)
    if (data.user) {
      const profileRow = { id: data.user.id, email, full_name: fullName, avatar_url: null, role: defaultRole }
      const { error: profileError } = await supabase.from('profiles').upsert(profileRow)
      if (profileError) {
        console.error('[useAuth] profile upsert failed after signup', { userId: data.user.id, profileError })
        throw new Error(profileError.message)
      }
      setProfile({ ...profileRow, created_at: new Date().toISOString() })
    }
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    setUser(null)
    setProfile(null)
  }

  return { user, profile, role, permissions: permissions ?? getPermissions(role), signUp, signIn, signOut, loading }
}
