import { supabase } from '../../../lib/supabase'
import { manifestToTemplate } from '../../../template-engine'
import { listTemplates } from '../../../template-engine/registry'
import { registerFounderTemplates } from '../../../templates/founder/registerFounderTemplates'
import type { AdminTemplate } from '../types'

export async function fetchAdminTemplates(search = ''): Promise<AdminTemplate[]> {
  registerFounderTemplates()
  let query = supabase.from('templates').select('*').order('created_at', { ascending: false })

  if (search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},slug.ilike.${term},component_name.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  const databaseTemplates = (data ?? []) as AdminTemplate[]
  const databaseComponentKeys = new Set(databaseTemplates.map((template) => template.component_key ?? template.component_name))
  const localOnlyTemplates = listTemplates({ includeDisabled: true })
    .filter((entry) => !databaseComponentKeys.has(entry.manifest.componentKey))
    .map((entry) => ({
      ...manifestToTemplate(entry.manifest),
      description: entry.manifest.description,
      component_key: entry.manifest.componentKey,
      renderer_type: entry.manifest.rendererType,
      manifest_json: entry.manifest as unknown as Record<string, unknown>,
      preview_video_url: entry.manifest.previewVideoUrl ?? null,
      storage_prefix: entry.manifest.storagePrefix ?? null,
    }) as AdminTemplate)

  const normalizedSearch = search.trim().toLowerCase()
  const merged = [...databaseTemplates, ...localOnlyTemplates]
  if (!normalizedSearch) return merged

  return merged.filter((template) =>
    [template.name, template.slug, template.component_name, template.component_key, template.description]
      .some((value) => value?.toLowerCase().includes(normalizedSearch))
  )
}

export async function setTemplateActive(templateId: string, isActive: boolean, adminUserId: string): Promise<void> {
  const { error } = await supabase.from('templates').update({ is_active: isActive }).eq('id', templateId)
  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from('admin_activity_logs').insert({
    admin_user_id: adminUserId,
    action: isActive ? 'template_enabled' : 'template_disabled',
    target_type: 'template',
    target_id: templateId,
    metadata: { is_active: isActive },
  })

  if (logError) throw new Error(logError.message)
}

export async function createTemplateMetadataFromPlugin(template: AdminTemplate, adminUserId: string): Promise<AdminTemplate> {
  const { data, error } = await supabase
    .from('templates')
    .insert({
      name: template.name,
      slug: template.slug,
      occasion: template.occasion,
      tier: template.tier,
      price_paise: template.price_paise,
      thumbnail_url: template.thumbnail_url,
      preview_url: template.preview_url,
      preview_video_url: template.preview_video_url,
      has_animation: template.has_animation,
      has_music: template.has_music,
      component_name: template.component_name,
      component_key: template.component_key ?? template.component_name,
      renderer_type: template.renderer_type ?? 'react-component',
      manifest_json: template.manifest_json ?? null,
      description: template.description ?? null,
      is_active: false,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from('admin_activity_logs').insert({
    admin_user_id: adminUserId,
    action: 'template_metadata_created',
    target_type: 'template',
    target_id: data.id,
    metadata: { slug: template.slug, component_name: template.component_name },
  })

  if (logError) throw new Error(logError.message)
  return data as AdminTemplate
}

export async function updateTemplateStatus(templateId: string, status: NonNullable<AdminTemplate['status']>, adminUserId: string): Promise<void> {
  const isPublished = status === 'published'
  const { error } = await supabase
    .from('templates')
    .update({
      status,
      is_active: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
    })
    .eq('id', templateId)

  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from('admin_activity_logs').insert({
    admin_user_id: adminUserId,
    action: `template_${status}`,
    target_type: 'template',
    target_id: templateId,
    metadata: { status, is_active: isPublished },
  })

  if (logError) throw new Error(logError.message)
}

export async function updateTemplateMetadata(templateId: string, updates: Partial<Pick<AdminTemplate, 'name' | 'description' | 'price_paise' | 'thumbnail_url' | 'preview_video_url'>>, adminUserId: string): Promise<void> {
  const { error } = await supabase.from('templates').update(updates).eq('id', templateId)
  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from('admin_activity_logs').insert({
    admin_user_id: adminUserId,
    action: 'template_metadata_updated',
    target_type: 'template',
    target_id: templateId,
    metadata: updates,
  })

  if (logError) throw new Error(logError.message)
}

export async function deleteTemplate(templateId: string, adminUserId: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', templateId)
  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from('admin_activity_logs').insert({
    admin_user_id: adminUserId,
    action: 'template_deleted',
    target_type: 'template',
    target_id: templateId,
    metadata: {},
  })

  if (logError) throw new Error(logError.message)
}
