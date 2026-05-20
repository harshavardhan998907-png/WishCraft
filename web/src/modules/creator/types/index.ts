import type { OccasionType, TemplateTier } from '../../../types'

export type TemplateStatus = 'draft' | 'review' | 'published' | 'hidden' | 'archived' | 'rejected'

export interface CreatorProfile {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  social_links: Record<string, unknown>
  is_verified: boolean
  total_template_views: number
  total_template_uses: number
  created_at: string
}

export interface CreatorTemplate {
  id: string
  creator_id: string
  name: string
  slug: string
  occasion: OccasionType
  tier: TemplateTier
  price_paise: number
  thumbnail_url: string | null
  preview_url: string | null
  has_animation: boolean
  has_music: boolean
  component_name: string
  is_active: boolean
  status: TemplateStatus
  is_marketplace_template: boolean
  moderation_notes: string | null
  published_at: string | null
  created_at: string
}

export interface CreatorTemplateInput {
  name: string
  slug: string
  occasion: OccasionType
  tier: TemplateTier
  price_paise: number
  thumbnail_url?: string | null
  has_animation: boolean
  has_music: boolean
  component_name: string
}

export interface CreatorTemplateMetric {
  creator_id: string
  user_id: string
  template_count: number
  total_views: number
  total_uses: number
  conversion_rate: number
}

export interface CreatorTemplatePopularity {
  template_id: string
  template_name: string
  template_slug: string
  total_views: number
  total_uses: number
  total_conversions: number
  conversion_rate: number
}
