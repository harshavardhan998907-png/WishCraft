import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'
import { getSessionId } from '../../analytics/utils/device'
import { notifyWishOwner } from '../../notifications/services/notificationService'
import type { CreatorEngagementMetric, EngagementMetrics, EngagementReport, ReactionType, WishMessage, WishReactionSummary } from '../types'

export const reactionOptions: Array<{ type: ReactionType; label: string }> = [
  { type: 'heart', label: 'Heart' },
  { type: 'sparkles', label: 'Sparkles' },
  { type: 'laugh', label: 'Laugh' },
  { type: 'wow', label: 'Wow' },
  { type: 'blessing', label: 'Blessing' },
]

const reactionSymbols: Record<ReactionType, string> = {
  heart: '♥',
  sparkles: '*',
  laugh: ':)',
  wow: '!',
  blessing: '+',
}

const blockedTerms = /(spam|scam|abuse|hate|fuck|shit|bitch|https?:\/\/|www\.)/i

export function reactionSymbol(type: ReactionType) {
  return reactionSymbols[type]
}

export function sanitizeEngagementText(value: string, maxLength = 500) {
  return value.replace(/<[^>]*>/g, '').replace(/[{}[\]<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function needsModeration(value: string) {
  return blockedTerms.test(value)
}

function sessionId() {
  return getSessionId() ?? 'anonymous-session'
}

export async function fetchWishReactionSummary(wishId: string): Promise<WishReactionSummary[]> {
  const { data, error } = await supabase
    .from('wish_reactions')
    .select('reaction_type')
    .eq('wish_id', wishId)

  if (error) throw new Error(error.message)
  const counts = new Map<ReactionType, number>()
  ;(data ?? []).forEach((row) => {
    const type = row.reaction_type as ReactionType
    counts.set(type, (counts.get(type) ?? 0) + 1)
  })
  return reactionOptions.map((item) => ({ reaction_type: item.type, total_count: counts.get(item.type) ?? 0 }))
}

export async function addWishReaction(input: { wishId: string; templateId?: string; reactionType: ReactionType }) {
  const { error } = await supabase.rpc('add_wish_reaction', {
    target_wish_id: input.wishId,
    target_reaction_type: input.reactionType,
    target_session_id: sessionId(),
  })
  if (error) throw new Error(error.message)
  void trackEvent({
    eventName: 'wish_reaction_added',
    wishId: input.wishId,
    templateId: input.templateId,
    metadata: { reaction_type: input.reactionType },
  })
  void notifyWishOwner({
    wishId: input.wishId,
    type: 'engagement_milestone',
    title: 'New wish reaction',
    message: `Someone reacted with ${input.reactionType}.`,
    metadata: { wish_id: input.wishId, template_id: input.templateId, reaction_type: input.reactionType },
  })
}

export async function fetchWishMessages(wishId: string): Promise<WishMessage[]> {
  const { data, error } = await supabase
    .from('wish_messages')
    .select('*')
    .eq('wish_id', wishId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data ?? []) as WishMessage[]
}

export async function addWishMessage(input: { wishId: string; templateId?: string; senderName: string; message: string }) {
  const senderName = sanitizeEngagementText(input.senderName, 80)
  const message = sanitizeEngagementText(input.message, 500)
  if (!senderName || !message) throw new Error('Name and message are required')

  const { data, error } = await supabase.rpc('add_wish_message', {
    target_wish_id: input.wishId,
    sender_name_input: senderName,
    sender_message_input: message,
    target_session_id: sessionId(),
  })
  if (error) throw new Error(error.message)
  void trackEvent({
    eventName: 'wish_message_added',
    wishId: input.wishId,
    templateId: input.templateId,
    metadata: { moderation_flag: needsModeration(`${senderName} ${message}`) },
  })
  void notifyWishOwner({
    wishId: input.wishId,
    type: 'engagement_message',
    title: 'New wish message',
    message: `${senderName} left a message on your wish.`,
    metadata: { wish_id: input.wishId, template_id: input.templateId, message_id: data },
  })
  return data as string
}

export async function reportEngagement(input: { targetType: 'message' | 'reaction' | 'wish'; targetId: string; reason: string }) {
  const reason = sanitizeEngagementText(input.reason, 300)
  if (!reason) throw new Error('Report reason is required')
  const { error } = await supabase.rpc('create_engagement_report', {
    target_type_input: input.targetType,
    target_id_input: input.targetId,
    reason_input: reason,
    reporter_session_id_input: sessionId(),
  })
  if (error) throw new Error(error.message)
  void trackEvent({ eventName: 'engagement_report_created', metadata: { target_type: input.targetType, target_id: input.targetId } })
}

export async function fetchModerationMessages(): Promise<WishMessage[]> {
  const { data, error } = await supabase
    .from('wish_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as WishMessage[]
}

export async function fetchEngagementReports(): Promise<EngagementReport[]> {
  const { data, error } = await supabase
    .from('engagement_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as EngagementReport[]
}

export async function moderateWishMessage(input: { messageId: string; hidden: boolean }) {
  const { error } = await supabase
    .from('wish_messages')
    .update({ is_hidden: input.hidden, moderation_status: input.hidden ? 'hidden' : 'approved' })
    .eq('id', input.messageId)

  if (error) throw new Error(error.message)
  void trackEvent({ eventName: 'engagement_hidden', metadata: { message_id: input.messageId, hidden: input.hidden } })
  const adminUserId = (await supabase.auth.getUser()).data.user?.id
  if (adminUserId) {
    await supabase.from('admin_activity_logs').insert({
      admin_user_id: adminUserId,
      action: input.hidden ? 'engagement_message_hidden' : 'engagement_message_approved',
      target_type: 'wish_message',
      target_id: input.messageId,
      metadata: { hidden: input.hidden },
    })
  }
}

export async function updateEngagementReport(input: { reportId: string; status: EngagementReport['status'] }) {
  const { error } = await supabase.from('engagement_reports').update({ status: input.status }).eq('id', input.reportId)
  if (error) throw new Error(error.message)
}

export async function fetchEngagementMetrics(): Promise<EngagementMetrics> {
  const { data, error } = await supabase.from('engagement_metrics').select('*').single()
  if (error) throw new Error(error.message)
  return data as EngagementMetrics
}

export async function fetchCreatorEngagementMetrics(): Promise<CreatorEngagementMetric[]> {
  const { data, error } = await supabase
    .from('creator_engagement_metrics')
    .select('*')
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []) as CreatorEngagementMetric[]
}
