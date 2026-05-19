import { supabase } from '../../../lib/supabase'
import type { AdminUser } from '../types'

export async function fetchAdminUsers(search = ''): Promise<AdminUser[]> {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)

  if (search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`email.ilike.${term},full_name.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminUser[]
}
