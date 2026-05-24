export type ReactionType = 'heart' | 'sparkles' | 'laugh' | 'wow' | 'blessing'

export interface WishReactionSummary {
  reaction_type: ReactionType
  total_count: number
}

export interface WishMessage {
  id: string
  wish_id: string
  sender_name: string
  sender_message: string
  is_hidden: boolean
  moderation_status: 'approved' | 'pending' | 'hidden' | 'rejected'
  user_id: string | null
  session_id: string
  created_at: string
}

export interface EngagementReport {
  id: string
  target_type: 'message' | 'reaction' | 'wish'
  target_id: string
  reason: string
  reporter_session_id: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
}

export interface EngagementMetrics {
  total_reactions: number
  total_messages: number
  most_reacted_templates: Array<{ template_id: string; template_name: string; reaction_count: number }>
  engagement_rate: number
  creator_engagement_score: Array<{ creator_id: string; display_name: string | null; engagement_score: number }>
}

export interface CreatorEngagementMetric {
  creator_id: string
  template_id: string
  template_name: string
  template_slug: string
  total_reactions: number
  total_messages: number
  engagement_score: number
}
