import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isWishExpired } from '../lib/utils'
import type { Wish, WishPageData } from '../types'

export function useWish(slug?: string) {
  const [data, setData] = useState<WishPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    supabase.from('wishes').select('*, template:templates(*)').eq('slug', slug).single().then(({ data: wish, error: fetchError }) => {
      if (fetchError || !wish) {
        console.warn('[useWish] wish lookup failed', { slug, fetchError })
        setError(fetchError?.message ?? 'Wish not found')
      } else {
        const typedWish = wish as Wish
        console.info('[useWish] loaded wish', { slug, wishId: typedWish.id, templateId: typedWish.template_id, status: typedWish.status })
        setData({ wish: typedWish, template: typedWish.template!, isExpired: isWishExpired(typedWish) })
      }
      setLoading(false)
    })
  }, [slug])

  return { data, loading, error }
}
