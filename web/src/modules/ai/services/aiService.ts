import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'
import { getCached } from '../../performance/services/cacheService'
import { withCircuitBreaker, withRetry } from '../../performance/services/loggerService'
import type { AIGenerationLog, AITemplateRecommendation, AIUsageMetrics, AIWishContext, AIWishResponse, CreatorMetadataInput } from '../types'

function sanitize(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/[{}[\]<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 700)
}

async function invokeAI<T>(action: string, context: Record<string, unknown>): Promise<T> {
  try {
    return await withCircuitBreaker(
      `ai-services:${action}`,
      () => withRetry(async () => {
        const { data, error } = await supabase.functions.invoke('ai-services', { body: { action, context } })
        if (error) throw error
        return data as T
      }, {
        serviceName: 'ai-services',
        operationName: action,
        attempts: 2,
      }),
      () => {
        throw new Error('AI is temporarily degraded')
      },
    )
  } catch (error) {
    void trackEvent({ eventName: 'ai_generation_failed', metadata: { action, reason: error instanceof Error ? error.message : 'AI request failed' } })
    throw new Error(error instanceof Error ? error.message : 'AI is unavailable right now')
  }
}

export async function generateWishMessage(context: AIWishContext): Promise<AIWishResponse> {
  const data = await invokeAI<AIWishResponse>('generate_wish', { ...context })
  return { ...data, message: sanitize(data.message) }
}

export async function fetchAITemplateRecommendations(context: Partial<AIWishContext>): Promise<AITemplateRecommendation[]> {
  try {
    const data = await getCached('ai_recommendations', JSON.stringify(context), 60_000, () => invokeAI<{ recommendations: AITemplateRecommendation[] }>('recommend_templates', context))
    void trackEvent({ eventName: 'template_recommendation_served', metadata: { count: data.recommendations.length, occasion: context.occasion, tone: context.tone } })
    return data.recommendations
  } catch {
    return []
  }
}

export async function generateCreatorMetadata(input: CreatorMetadataInput) {
  const data = await invokeAI<{ suggestion: string; fallback: boolean }>('creator_metadata', { ...input })
  return { ...data, suggestion: sanitize(data.suggestion) }
}

export async function fetchAIUsageMetrics(): Promise<AIUsageMetrics> {
  const { data, error } = await withRetry(
    async () => supabase.from('ai_usage_metrics').select('*').single(),
    { serviceName: 'ai-analytics', operationName: 'fetch_usage_metrics', attempts: 2 },
  )
  if (error) throw new Error(error.message)
  return data as AIUsageMetrics
}

export async function fetchAIGenerationLogs(): Promise<AIGenerationLog[]> {
  const { data, error } = await supabase
    .from('ai_generation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as AIGenerationLog[]
}
