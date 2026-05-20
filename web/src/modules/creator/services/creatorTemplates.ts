import { supabase } from '../../../lib/supabase'
import type { CreatorTemplate, CreatorTemplateInput } from '../types'
import { isMissingMarketplaceSchema } from './marketplaceSchema'

export async function fetchCreatorTemplates(creatorId: string): Promise<CreatorTemplate[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingMarketplaceSchema(error)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as CreatorTemplate[]
}

export async function createTemplateDraft(creatorId: string, input: CreatorTemplateInput): Promise<CreatorTemplate> {
  const { data, error } = await supabase
    .from('templates')
    .insert({
      ...input,
      creator_id: creatorId,
      status: 'draft',
      is_active: false,
      is_marketplace_template: true,
    })
    .select('*')
    .single()

  if (error) {
    if (isMissingMarketplaceSchema(error)) throw new Error('Creator template storage is not ready yet.')
    throw new Error(error.message)
  }
  return data as CreatorTemplate
}

export async function updateTemplateMetadata(templateId: string, input: Partial<CreatorTemplateInput>): Promise<CreatorTemplate> {
  const { data, error } = await supabase
    .from('templates')
    .update(input)
    .eq('id', templateId)
    .select('*')
    .single()

  if (error) {
    if (isMissingMarketplaceSchema(error)) throw new Error('Creator template storage is not ready yet.')
    throw new Error(error.message)
  }
  return data as CreatorTemplate
}

export async function uploadTemplateThumbnail(file: File, pathPrefix: string): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${pathPrefix}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('template-thumbnails').upload(filePath, file, { upsert: true })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('template-thumbnails').getPublicUrl(filePath)
  return data.publicUrl
}

export async function submitTemplateForReview(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .update({ status: 'review', is_active: false })
    .eq('id', templateId)

  if (error) {
    if (isMissingMarketplaceSchema(error)) throw new Error('Creator template storage is not ready yet.')
    throw new Error(error.message)
  }
}

export async function archiveCreatorTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .update({ status: 'archived', is_active: false })
    .eq('id', templateId)

  if (error) {
    if (isMissingMarketplaceSchema(error)) throw new Error('Creator template storage is not ready yet.')
    throw new Error(error.message)
  }
}
