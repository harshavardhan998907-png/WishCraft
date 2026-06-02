import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'

export interface GlobalGrowthMetrics {
  growth_by_region: Record<string, number>
  creator_growth: number
  engagement_growth: number
  ai_usage_growth: number
  revenue_growth: number
  retention_metrics: {
    active_users_30d: number
    returning_users_30d: number
  }
  active_ecosystem_keys: number
  ecosystem_usage: number
}

export interface PlatformIntelligenceMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_category: string
  generated_at: string
}

export async function fetchGlobalGrowthMetrics(): Promise<GlobalGrowthMetrics> {
  const { data, error } = await supabase.from('global_growth_metrics').select('*').single()
  if (error) throw new Error(error.message)
  return data as GlobalGrowthMetrics
}

export async function fetchPlatformIntelligenceMetrics(): Promise<PlatformIntelligenceMetric[]> {
  const { data, error } = await supabase
    .from('platform_intelligence_metrics')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as PlatformIntelligenceMetric[]
}

export async function generatePlatformGrowthSnapshot() {
  const { data, error } = await supabase.rpc('create_platform_growth_snapshot')
  if (error) throw new Error(error.message)
  void trackEvent({ eventName: 'platform_growth_snapshot_generated', metadata: { snapshot_id: data } })
  return data as string
}
