import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'

import { withCircuitBreaker, withRetry } from '../../performance/services/loggerService'
import { logSecurityAudit, recordRateLimitEvent } from '../../security/services/governanceService'
import type { AIGenerationLog, AIUsageMetrics, AIWishContext, AIWishResponse, CreatorMetadataInput } from '../types'
import { getCsrfToken } from '../../../lib/csrf'

function sanitize(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/[{}[\]<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 700)
}

async function invokeAI<T>(action: string, context: Record<string, unknown>): Promise<T> {
  const localePreference = { locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  const localizedContext = {
    ...context,
    preferred_locale: localePreference.locale,
    preferred_timezone: localePreference.timezone,
  }

  void recordRateLimitEvent({
    key: action,
    action: `ai:${action}`,
    blocked: false,
    metadata: { context_keys: Object.keys(localizedContext).slice(0, 12), locale: localePreference.locale },
  }).catch((error) => console.warn('[Governance] AI rate event failed', error))

  try {
    return await withCircuitBreaker(
      `ai-services:${action}`,
      () => withRetry(async () => {
        const { data, error } = await supabase.functions.invoke('ai-services', {
          body: { action, context: localizedContext },
          headers: { 'X-CSRF-Token': getCsrfToken() },
        })
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
    void logSecurityAudit({
      eventType: 'ai_request_failed',
      targetType: 'ai_service',
      targetId: action,
      riskLevel: 'low',
      metadata: { reason: error instanceof Error ? error.message : 'AI request failed' },
    }).catch((auditError) => console.warn('[Governance] AI failure audit failed', auditError))
    throw new Error(error instanceof Error ? error.message : 'AI is unavailable right now')
  }
}

export async function generateWishMessage(context: AIWishContext): Promise<AIWishResponse> {
  const data = await invokeAI<AIWishResponse>('generate_wish', { ...context })
  return { ...data, message: sanitize(data.message) }
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
