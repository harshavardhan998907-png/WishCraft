import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCached } from '../modules/performance/services/cacheService'
import type { Template } from '../types'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCached('template_metadata', 'published_templates', 120_000, async () => {
      const { data, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('tier', { ascending: true })
      if (fetchError) throw fetchError
      return (data ?? []) as Template[]
    })
      .then((data) => {
        console.info('[useTemplates] loaded templates from Supabase', { count: data.length })
        setTemplates(data)
      })
      .catch((fetchError) => {
        console.error('[useTemplates] failed to load templates', {
          reason: fetchError instanceof Error ? fetchError.message : 'Template fetch failed',
        })
        setTemplates([])
        setError(fetchError instanceof Error ? fetchError.message : 'Template fetch failed')
      })
      .finally(() => setLoading(false))
  }, [])

  return { templates, loading, error }
}
