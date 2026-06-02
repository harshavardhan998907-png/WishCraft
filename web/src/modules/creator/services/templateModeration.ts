import { supabase } from '../../../lib/supabase'
import { notifyUser } from '../../notifications/services/notificationService'
import { trackPrivilegedAction } from '../../security/services/governanceService'
import type { CreatorTemplate, TemplateStatus } from '../types'

const moderationActions: Record<TemplateStatus, string> = {
  draft: 'template_moved_to_draft',
  review: 'template_submitted_for_review',
  published: 'template_approved',
  hidden: 'template_hidden',
  archived: 'template_archived',
  rejected: 'template_rejected',
}

export async function fetchTemplatesForModeration(): Promise<CreatorTemplate[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .in('status', ['review', 'published', 'hidden', 'rejected'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CreatorTemplate[]
}

export async function moderateTemplate(input: { templateId: string; status: Exclude<TemplateStatus, 'draft' | 'review'>; notes?: string; adminUserId: string }): Promise<void> {
  const { data: existingTemplate } = await supabase
    .from('templates')
    .select('name, creator:creator_profiles(user_id)')
    .eq('id', input.templateId)
    .maybeSingle()

  const { error } = await supabase
    .from('templates')
    .update({
      status: input.status,
      is_active: input.status === 'published',
      moderation_notes: input.notes ?? null,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', input.templateId)

  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from('admin_activity_logs').insert({
    admin_user_id: input.adminUserId,
    action: moderationActions[input.status],
    target_type: 'template',
    target_id: input.templateId,
    metadata: { status: input.status, notes: input.notes ?? null },
  })

  if (logError) throw new Error(logError.message)

  void trackPrivilegedAction({
    eventType: moderationActions[input.status],
    targetType: 'template',
    targetId: input.templateId,
    metadata: { status: input.status, notes: input.notes ?? null, admin_user_id: input.adminUserId },
  }).catch((auditError) => console.warn('[Governance] template moderation audit failed', auditError))

  const creator = Array.isArray(existingTemplate?.creator) ? existingTemplate.creator[0] : existingTemplate?.creator
  const creatorUserId = creator?.user_id
  if (creatorUserId) {
    void notifyUser({
      userId: creatorUserId,
      type: 'template_moderation',
      title: 'Template moderation update',
      message: `${existingTemplate?.name ?? 'Your template'} was ${input.status}.`,
      metadata: { template_id: input.templateId, status: input.status, notes: input.notes ?? null },
    })
  }
}
