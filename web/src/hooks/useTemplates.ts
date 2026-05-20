import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Template } from '../types'

export const demoTemplates: Template[] = [
  { id: 'birthday-classic', name: 'Birthday Classic', slug: 'birthday-classic', occasion: 'birthday', tier: 'free', price_paise: 0, thumbnail_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80', preview_url: null, has_animation: true, has_music: false, component_name: 'birthday-classic', is_active: true },
  { id: 'birthday-glow', name: 'Birthday Glow', slug: 'birthday-glow', occasion: 'birthday', tier: 'standard', price_paise: 9900, thumbnail_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80', preview_url: null, has_animation: true, has_music: true, component_name: 'birthday-glow', is_active: true },
  { id: 'wedding-elegant', name: 'Wedding Elegant', slug: 'wedding-elegant', occasion: 'wedding', tier: 'premium', price_paise: 19900, thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80', preview_url: null, has_animation: true, has_music: true, component_name: 'wedding-elegant', is_active: true },
  { id: 'anniversary-romantic', name: 'Anniversary Romantic', slug: 'anniversary-romantic', occasion: 'anniversary', tier: 'standard', price_paise: 12900, thumbnail_url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80', preview_url: null, has_animation: true, has_music: true, component_name: 'anniversary-romantic', is_active: true },
  { id: 'festival-diwali', name: 'Festival Diwali', slug: 'festival-diwali', occasion: 'festival', tier: 'premium', price_paise: 17900, thumbnail_url: 'https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?auto=format&fit=crop&w=900&q=80', preview_url: null, has_animation: true, has_music: true, component_name: 'festival-diwali', is_active: true },
  { id: 'graduation-celebration', name: 'Graduation Celebration', slug: 'graduation-celebration', occasion: 'graduation', tier: 'free', price_paise: 0, thumbnail_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80', preview_url: null, has_animation: true, has_music: false, component_name: 'graduation-celebration', is_active: true },
]

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('templates').select('*').eq('is_active', true).eq('status', 'published').order('tier', { ascending: true }).then(({ data, error: fetchError }) => {
      if (fetchError || !data?.length) {
        console.warn('[useTemplates] falling back to demo templates', {
          reason: fetchError?.message ?? 'No active templates returned from Supabase',
          code: fetchError?.code,
        })
        setTemplates(demoTemplates)
        if (fetchError) setError(fetchError.message)
      } else {
        console.info('[useTemplates] loaded templates from Supabase', { count: data.length })
        setTemplates(data as Template[])
      }
      setLoading(false)
    })
  }, [])

  return { templates, loading, error }
}
