import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'
import type { AnalyticsEventName } from '../../analytics/types'

export type GovernanceRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityAuditLog {
  id: string
  actor_user_id: string | null
  event_type: string
  target_type: string | null
  target_id: string | null
  risk_level: GovernanceRiskLevel
  metadata: Record<string, unknown>
  ip_hash: string | null
  created_at: string
}

export interface ConsentRecord {
  id: string
  user_id: string
  consent_type: string
  consent_version: string
  granted: boolean
  granted_at: string
}

export interface DataExportRequest {
  id: string
  user_id: string
  export_status: string
  requested_at: string
  completed_at: string | null
}

export interface AccountDeletionRequest {
  id: string
  user_id: string
  request_status: string
  scheduled_deletion_at: string
  completed_at: string | null
}

export interface SecurityMonitoringMetrics {
  failed_login_attempts: number
  suspicious_actions: number
  admin_privilege_changes: number
  abuse_reports: number
  blocked_requests: number
}

export interface SecurityRateLimitEvent {
  id: string
  actor_user_id: string | null
  rate_limit_key: string
  action: string
  event_count: number
  blocked: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface ActiveSessionSummary {
  id: string
  device: string
  lastActiveAt: string
  current: boolean
}

const securityEventNames: readonly AnalyticsEventName[] = [
  'suspicious_login_detected',
  'admin_privilege_changed',
  'compliance_export_requested',
  'account_deletion_requested',
  'rate_limit_triggered',
]

function isSecurityAnalyticsEvent(eventName: string): eventName is AnalyticsEventName {
  return securityEventNames.includes(eventName as AnalyticsEventName)
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function logSecurityAudit(input: {
  eventType: string
  targetType?: string
  targetId?: string
  riskLevel?: GovernanceRiskLevel
  metadata?: Record<string, unknown>
  ipHash?: string
}) {
  const { data, error } = await supabase.rpc('create_security_audit_log', {
    target_event_type: input.eventType,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    target_risk_level: input.riskLevel ?? 'low',
    target_metadata: input.metadata ?? {},
    target_ip_hash: input.ipHash ?? null,
  })
  if (error) throw new Error(error.message)

  if (isSecurityAnalyticsEvent(input.eventType)) {
    void trackEvent({
      eventName: input.eventType,
      metadata: {
        audit_id: data,
        target_type: input.targetType,
        target_id: input.targetId,
        risk_level: input.riskLevel ?? 'low',
        ...input.metadata,
      },
    })
  }

  return data as string
}

export async function trackPrivilegedAction(input: {
  eventType: string
  targetType: string
  targetId?: string
  metadata?: Record<string, unknown>
}) {
  return logSecurityAudit({
    eventType: input.eventType,
    targetType: input.targetType,
    targetId: input.targetId,
    riskLevel: input.eventType.includes('privilege') ? 'critical' : 'high',
    metadata: { privileged: true, ...input.metadata },
  })
}

export async function recordRateLimitEvent(input: { key: string; action: string; blocked: boolean; metadata?: Record<string, unknown> }) {
  const { data, error } = await supabase.rpc('record_security_rate_limit_event', {
    target_rate_limit_key: input.key,
    target_action: input.action,
    target_blocked: input.blocked,
    target_metadata: input.metadata ?? {},
  })
  if (error) throw new Error(error.message)
  return data as string
}

export async function fetchActiveSessions(): Promise<ActiveSessionSummary[]> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) return []

  return [{
    id: data.session.access_token.slice(-12),
    device: navigator.userAgent,
    lastActiveAt: new Date().toISOString(),
    current: true,
  }]
}

export async function requestDataExport() {
  const { data, error } = await supabase.rpc('create_data_export_request')
  if (error) throw new Error(error.message)
  return data as string
}

export async function requestAccountDeletion() {
  const { data, error } = await supabase.rpc('create_account_deletion_request')
  if (error) throw new Error(error.message)
  return data as string
}

export async function recordConsent(input: { consentType: string; consentVersion: string; granted: boolean }) {
  const userId = await currentUserId()
  if (!userId) throw new Error('You must be signed in')

  const { data, error } = await supabase
    .from('consent_records')
    .insert({
      user_id: userId,
      consent_type: input.consentType,
      consent_version: input.consentVersion,
      granted: input.granted,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  await logSecurityAudit({
    eventType: 'consent_recorded',
    targetType: 'consent_record',
    targetId: data.id,
    riskLevel: 'low',
    metadata: input,
  })
  return data.id as string
}

export async function fetchConsentHistory(): Promise<ConsentRecord[]> {
  const { data, error } = await supabase
    .from('consent_records')
    .select('*')
    .order('granted_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as ConsentRecord[]
}

export async function fetchDataExportRequests(): Promise<DataExportRequest[]> {
  const { data, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return (data ?? []) as DataExportRequest[]
}

export async function fetchAccountDeletionRequests(): Promise<AccountDeletionRequest[]> {
  const { data, error } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .order('scheduled_deletion_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return (data ?? []) as AccountDeletionRequest[]
}

export async function fetchSecurityMonitoringMetrics(): Promise<SecurityMonitoringMetrics> {
  const { data, error } = await supabase.from('security_monitoring_metrics').select('*').single()
  if (error) throw new Error(error.message)
  return data as SecurityMonitoringMetrics
}

export async function fetchSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
  const { data, error } = await supabase
    .from('security_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as SecurityAuditLog[]
}

export async function fetchRateLimitEvents(): Promise<SecurityRateLimitEvent[]> {
  const { data, error } = await supabase
    .from('security_rate_limit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as SecurityRateLimitEvent[]
}
