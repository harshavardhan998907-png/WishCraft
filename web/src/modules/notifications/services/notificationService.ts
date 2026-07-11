import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'
import { withRetry } from '../../performance/services/loggerService'
import { logSecurityAudit } from '../../security/services/governanceService'
import type { AutomationLog, NotificationItem, NotificationMetrics, NotificationPreferences, ScheduledJob } from '../types'

function clean(value: string, maxLength = 600) {
  return value.replace(/<[^>]*>/g, '').replace(/[{}[\]<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data, error } = await withRetry(async () => supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100), { serviceName: 'notifications', operationName: 'fetch_notifications', attempts: 2 })

  if (error) throw new Error(error.message)
  return (data ?? []) as NotificationItem[]
}

export async function fetchUnreadNotificationCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  if (error) throw new Error(error.message)
  void trackEvent({ eventName: 'notification_opened', metadata: { notification_id: notificationId } })
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
  if (error) throw new Error(error.message)
}

export async function createSelfNotification(input: { type: string; title: string; message: string; metadata?: Record<string, unknown> }) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return null
  const { data, error } = await withRetry(async () => supabase.rpc('create_notification', {
    target_user_id: userId,
    target_notification_type: clean(input.type, 80),
    target_title: clean(input.title, 140),
    target_message: clean(input.message, 600),
    target_metadata: { locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...(input.metadata ?? {}) },
  }), { serviceName: 'notifications', operationName: 'create_self_notification', attempts: 2 })

  if (error) {
    console.warn('[Notifications] create self notification failed', error)
    return null
  }
  void trackEvent({ eventName: 'notification_sent', metadata: { notification_id: data, type: input.type } })
  return data as string | null
}

export async function notifyUser(input: { userId: string; type: string; title: string; message: string; metadata?: Record<string, unknown> }) {
  const { data, error } = await withRetry(async () => supabase.rpc('create_admin_notification', {
    target_user_id: input.userId,
    target_notification_type: clean(input.type, 80),
    target_title: clean(input.title, 140),
    target_message: clean(input.message, 600),
    target_metadata: { locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...(input.metadata ?? {}) },
  }), { serviceName: 'notifications', operationName: 'create_admin_notification', attempts: 2 })
  if (error) {
    console.warn('[Notifications] notify user failed', error)
    return null
  }
  void trackEvent({ eventName: 'notification_sent', metadata: { notification_id: data, type: input.type } })
  return data as string | null
}

export async function notifyWishOwner(input: { wishId: string; type: string; title: string; message: string; metadata?: Record<string, unknown> }) {
  const { data, error } = await withRetry(async () => supabase.rpc('notify_wish_owner', {
    target_wish_id: input.wishId,
    target_notification_type: clean(input.type, 80),
    target_title: clean(input.title, 140),
    target_message: clean(input.message, 600),
    target_metadata: { locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...(input.metadata ?? {}) },
  }), { serviceName: 'notifications', operationName: 'notify_wish_owner', attempts: 2 })
  if (error) {
    console.warn('[Notifications] notify wish owner failed', error)
    return null
  }
  void trackEvent({ eventName: 'notification_sent', metadata: { notification_id: data, type: input.type, wish_id: input.wishId } })
  return data as string | null
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data) return data as NotificationPreferences

  const { data: created, error: createError } = await supabase
    .from('notification_preferences')
    .insert({ user_id: userId })
    .select('*')
    .single()
  if (createError) throw new Error(createError.message)
  return created as NotificationPreferences
}

export async function updateNotificationPreferences(input: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at'>>) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('You must be signed in')

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...input }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  void logSecurityAudit({
    eventType: 'notification_preferences_updated',
    targetType: 'notification_preferences',
    targetId: data.id,
    riskLevel: 'low',
    metadata: input,
  }).catch((auditError) => console.warn('[Governance] notification preference audit failed', auditError))
  return data as NotificationPreferences
}

export async function enqueueScheduledJob(input: { jobType: string; payload?: Record<string, unknown>; scheduledFor?: string }) {
  const { data, error } = await withRetry(async () => supabase.rpc('enqueue_scheduled_job', {
    target_job_type: input.jobType,
    target_payload: { locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...(input.payload ?? {}) },
    target_scheduled_for: input.scheduledFor ?? new Date().toISOString(),
  }), { serviceName: 'automation', operationName: 'enqueue_scheduled_job', attempts: 2 })
  if (error) throw new Error(error.message)
  void logSecurityAudit({
    eventType: 'automation_job_enqueued',
    targetType: 'scheduled_job',
    targetId: data as string,
    riskLevel: 'medium',
    metadata: { job_type: input.jobType, scheduled_for: input.scheduledFor },
  }).catch((auditError) => console.warn('[Governance] automation audit failed', auditError))
  return data as string
}

export async function fetchNotificationMetrics(): Promise<NotificationMetrics> {
  const { data, error } = await supabase.from('notification_metrics').select('*').single()
  if (error) throw new Error(error.message)
  return data as NotificationMetrics
}

export async function fetchScheduledJobs(): Promise<ScheduledJob[]> {
  const { data, error } = await supabase.from('scheduled_jobs').select('*').order('scheduled_for', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as ScheduledJob[]
}

export async function fetchAutomationLogs(): Promise<AutomationLog[]> {
  const { data, error } = await supabase.from('automation_logs').select('*').order('executed_at', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as AutomationLog[]
}
