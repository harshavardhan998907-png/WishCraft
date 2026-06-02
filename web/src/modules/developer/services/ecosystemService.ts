import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'
import { logSecurityAudit } from '../../security/services/governanceService'

export type ApiScope = 'templates:read' | 'analytics:read' | 'webhooks:write'

export interface EcosystemApiKey {
  id: string
  owner_user_id: string
  key_name: string
  access_scope: ApiScope[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
}

export interface EcosystemApiUsageEvent {
  id: string
  api_key_id: string | null
  owner_user_id: string | null
  endpoint: string
  request_status: string
  metadata: Record<string, unknown>
  created_at: string
}

function randomToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function fetchDeveloperApiKeys(): Promise<EcosystemApiKey[]> {
  const { data, error } = await supabase
    .from('ecosystem_api_keys')
    .select('id, owner_user_id, key_name, access_scope, is_active, last_used_at, created_at, revoked_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as EcosystemApiKey[]
}

export async function fetchDeveloperApiUsage(): Promise<EcosystemApiUsageEvent[]> {
  const { data, error } = await supabase
    .from('ecosystem_api_usage_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as EcosystemApiUsageEvent[]
}

export async function createDeveloperApiKey(input: { keyName: string; scopes: ApiScope[] }) {
  const rawKey = `th_live_${randomToken()}`
  const hash = await sha256(rawKey)
  const { data, error } = await supabase.rpc('create_ecosystem_api_key', {
    target_key_name: input.keyName,
    target_api_key_hash: hash,
    target_access_scope: input.scopes.length ? input.scopes : ['templates:read'],
  })
  if (error) throw new Error(error.message)

  void trackEvent({ eventName: 'api_key_generated', metadata: { key_id: data, scope: input.scopes } })
  void logSecurityAudit({
    eventType: 'api_key_generated',
    targetType: 'ecosystem_api_key',
    targetId: data as string,
    riskLevel: 'high',
    metadata: { scope: input.scopes },
  }).catch(() => undefined)

  return { id: data as string, rawKey }
}

export async function revokeDeveloperApiKey(keyId: string) {
  const { error } = await supabase.rpc('revoke_ecosystem_api_key', { target_key_id: keyId })
  if (error) throw new Error(error.message)
}
