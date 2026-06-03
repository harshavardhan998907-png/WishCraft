import { supabase } from '../../../lib/supabase'
import { getCached } from '../../performance/services/cacheService'
import type { AnalyticsEventInput, DailyAnalyticsMetric, TemplatePerformanceMetric } from '../types'
import { getDeviceType, getReferrer, getSessionId } from '../utils/device'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function compactMetadata(metadata: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null))
}

function asUuid(value: string | null | undefined) {
  return value && uuidPattern.test(value) ? value : null
}

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function trackEvent(input: AnalyticsEventInput) {
  try {
    const sessionId = getSessionId()
    const userId = input.userId === undefined ? await getCurrentUserId() : input.userId
    const row = {
      event_name: input.eventName,
      user_id: userId,
      wish_id: asUuid(input.wishId),
      template_id: asUuid(input.templateId),
      metadata: compactMetadata(input.metadata),
      device_type: getDeviceType(),
      referrer: getReferrer(),
      session_id: sessionId,
    }

    const { error } = await supabase.from('analytics_events').insert(row)
    if (error) console.warn('[Analytics] event insert failed', { eventName: input.eventName, error })
  } catch (error) {
    console.warn('[Analytics] tracking failed', error)
  }
}

export function trackWishOpen(input: { wishId: string; templateId: string; slug?: string }) {
  void trackEvent({
    eventName: 'wish_opened',
    wishId: input.wishId,
    templateId: input.templateId,
    metadata: { slug: input.slug },
  })

  void supabase.from('wish_views').insert({
    wish_id: input.wishId,
    viewer_session_id: getSessionId(),
    device_type: getDeviceType(),
    referrer: getReferrer(),
  }).then(({ error }) => {
    if (error) console.warn('[Analytics] wish view insert failed', error)
  })
}

export function trackTemplateSelection(input: { templateId: string; templateSlug: string; templateName: string; tier: string; occasion: string }) {
  void trackEvent({
    eventName: 'template_selected',
    templateId: input.templateId,
    metadata: {
      template_slug: input.templateSlug,
      template_name: input.templateName,
      tier: input.tier,
      occasion: input.occasion,
    },
  })
}

export function trackPaymentSuccess(input: { wishId: string; templateId: string; orderId?: string; paymentId?: string }) {
  void trackEvent({
    eventName: 'payment_success',
    wishId: input.wishId,
    templateId: input.templateId,
    metadata: {
      order_id: input.orderId,
      payment_id: input.paymentId,
    },
  })
}

export function trackPaymentFailed(input: { wishId?: string; templateId?: string; reason?: string }) {
  void trackEvent({
    eventName: 'payment_failed',
    wishId: input.wishId,
    templateId: input.templateId,
    metadata: { reason: input.reason },
  })
}

export function trackShareClick(input: { slug: string; action: 'copy' | 'open' | 'native_share' }) {
  void trackEvent({
    eventName: 'wish_shared',
    metadata: {
      slug: input.slug,
      action: input.action,
    },
  })
}

export function trackUpload(input: { type: 'photo' | 'music'; templateId?: string | null; fileCount?: number }) {
  void trackEvent({
    eventName: input.type === 'music' ? 'music_uploaded' : 'photo_uploaded',
    templateId: input.templateId ?? null,
    metadata: {
      type: input.type,
      file_count: input.fileCount,
    },
  })
}

export function trackStorageWarning(input: { reason: string; metadata?: Record<string, unknown> }) {
  void trackEvent({
    eventName: 'storage_warning',
    metadata: {
      reason: input.reason,
      ...input.metadata,
    },
  })
}

export function trackDashboardAction(input: { action: string; metadata?: Record<string, unknown> }) {
  void trackEvent({
    eventName: 'dashboard_opened',
    metadata: {
      action: input.action,
      ...input.metadata,
    },
  })
}

export async function fetchDailyAnalytics(): Promise<DailyAnalyticsMetric[]> {
  return getCached('analytics_aggregates', 'daily_30', 60_000, async () => {
    const { data, error } = await supabase
      .from('analytics_daily_metrics')
      .select('*')
      .order('metric_date', { ascending: false })
      .limit(30)
    if (error) throw new Error(error.message)
    return (data ?? []) as DailyAnalyticsMetric[]
  })
}

export async function fetchTemplatePerformance(): Promise<TemplatePerformanceMetric[]> {
  return getCached('analytics_aggregates', 'template_performance_10', 60_000, async () => {
    const { data, error } = await supabase
      .from('template_performance_metrics')
      .select('*')
      .limit(10)
    if (error) throw new Error(error.message)
    return (data ?? []) as TemplatePerformanceMetric[]
  })
}
