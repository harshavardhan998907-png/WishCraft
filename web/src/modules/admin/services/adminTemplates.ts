import { supabase } from '../../../lib/supabase'
import type { AdminTemplate } from '../types'

export async function fetchAdminTemplates(search = ''): Promise<AdminTemplate[]> {
  let query = supabase.from('templates').select('*').order('created_at', { ascending: false })

  if (search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},slug.ilike.${term},component_name.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminTemplate[]
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
