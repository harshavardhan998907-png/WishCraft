import type { OccasionType, Template, TemplateTier } from '../../../types'

export type AITone = 'birthday' | 'romantic' | 'funny' | 'emotional' | 'professional'

export interface AIWishContext {
  occasion: OccasionType
  tone: AITone
  relationship: string
  recipientAge: string
  language: string
}

export interface AIWishResponse {
  message: string
  fallback: boolean
}

export type AITemplateRecommendation = Template & {
  recommendation_score: number
  recommendation_reason: string
}

export interface CreatorMetadataInput {
  templateName: string
  occasion: OccasionType
  tier: TemplateTier
  description: string
}

export interface AIUsageMetrics {
  total_generations: number
  failed_generations: number
  popular_generation_types: Record<string, number>
  ai_usage_by_role: Record<string, number>
  ai_conversion_impact: number
}

export interface AIGenerationLog {
  id: string
  user_id: string | null
  generation_type: string
  input_context: Record<string, unknown>
  generated_output: string | null
  model_name: string | null
  token_usage: number | null
  generation_status: string
  created_at: string
}
