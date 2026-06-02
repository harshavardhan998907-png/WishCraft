export type GovernanceRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface GovernanceAuditInput {
  actorUserId?: string | null
  eventType: string
  targetType?: string | null
  targetId?: string | null
  riskLevel?: GovernanceRiskLevel
  metadata?: Record<string, unknown>
  ipHash?: string | null
}

export interface GovernanceClient {
  createSecurityAuditLog(input: GovernanceAuditInput): Promise<string | null>
  trackSecurityEvent?(eventName: string, metadata?: Record<string, unknown>): Promise<void>
}

const privilegedEvents = new Set([
  'admin_privilege_changed',
  'refund_completed',
  'template_approved',
  'template_hidden',
  'template_rejected',
  'automation_job_enqueued',
])

function normalizeRisk(eventType: string, riskLevel?: GovernanceRiskLevel): GovernanceRiskLevel {
  if (riskLevel) return riskLevel
  if (eventType.includes('deletion') || eventType.includes('privilege')) return 'high'
  if (eventType.includes('export') || eventType.includes('rate_limit')) return 'medium'
  return 'low'
}

export async function recordGovernanceAudit(client: GovernanceClient, input: GovernanceAuditInput) {
  const riskLevel = normalizeRisk(input.eventType, input.riskLevel)
  const auditId = await client.createSecurityAuditLog({ ...input, riskLevel })
  await client.trackSecurityEvent?.(input.eventType, {
    audit_id: auditId,
    target_type: input.targetType,
    target_id: input.targetId,
    risk_level: riskLevel,
    ...input.metadata,
  })
  return auditId
}

export function validatePrivilegedAction(input: { actorRole?: string | null; action: string }) {
  if (!privilegedEvents.has(input.action)) return true
  return input.actorRole === 'admin'
}

export async function trackPrivilegedAction(client: GovernanceClient, input: GovernanceAuditInput) {
  return recordGovernanceAudit(client, {
    ...input,
    riskLevel: input.riskLevel ?? 'high',
    metadata: {
      privileged: true,
      ...input.metadata,
    },
  })
}
