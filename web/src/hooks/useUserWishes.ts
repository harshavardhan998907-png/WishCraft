import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Wish } from '../types'

export function useUserWishes() {
  const { user } = useAuth()
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setWishes([])
      setLoading(false)
      return
    }

    setLoading(true)
    // Fetch wishes and their associated templates
    supabase
      .from('wishes')
      .select('*, template:templates(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.warn('[useUserWishes] fetch failed', { fetchError })
          setError(fetchError.message)
        } else {
          setWishes((data as Wish[]) || [])
        }
        setLoading(false)
      })
  }, [user])

  return { wishes, loading, error }
}
