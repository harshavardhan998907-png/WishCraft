import { supabase } from '../../../lib/supabase'
import type { CreatorTemplateMetric, CreatorTemplatePopularity } from '../types'
import { isMissingMarketplaceSchema } from './marketplaceSchema'

export async function fetchCreatorMetrics(userId: string): Promise<CreatorTemplateMetric | null> {
  const { data, error } = await supabase
    .from('creator_template_metrics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingMarketplaceSchema(error)) return null
    throw new Error(error.message)
  }
  return (data ?? null) as CreatorTemplateMetric | null
}

export async function fetchCreatorTemplatePopularity(creatorId: string): Promise<CreatorTemplatePopularity[]> {
  const { data, error } = await supabase
    .from('template_performance_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .limit(10)

  if (error) {
    if (isMissingMarketplaceSchema(error)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as CreatorTemplatePopularity[]
}
