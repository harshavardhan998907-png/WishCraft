import { supabase } from '../../../lib/supabase'
import type { CreatorProfile } from '../types'
import { isMissingMarketplaceSchema } from './marketplaceSchema'

export async function fetchCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingMarketplaceSchema(error)) return null
    throw new Error(error.message)
  }
  return (data ?? null) as CreatorProfile | null
}

export async function ensureCreatorProfile(input: { userId: string; displayName: string; avatarUrl?: string | null }): Promise<CreatorProfile | null> {
  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert({
      user_id: input.userId,
      display_name: input.displayName,
      avatar_url: input.avatarUrl ?? null,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    if (isMissingMarketplaceSchema(error)) return null
    throw new Error(error.message)
  }
  return data as CreatorProfile
}

export async function updateCreatorProfile(profileId: string, input: Pick<CreatorProfile, 'display_name' | 'bio' | 'avatar_url' | 'social_links'>): Promise<CreatorProfile> {
  const { data, error } = await supabase
    .from('creator_profiles')
    .update(input)
    .eq('id', profileId)
    .select('*')
    .single()

  if (error) {
    if (isMissingMarketplaceSchema(error)) throw new Error('Creator profile storage is not ready yet.')
    throw new Error(error.message)
  }
  return data as CreatorProfile
}
