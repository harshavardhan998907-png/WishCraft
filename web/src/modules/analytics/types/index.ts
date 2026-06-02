export type AnalyticsEventName =
  | 'wish_opened'
  | 'wish_shared'
  | 'template_selected'
  | 'payment_success'
  | 'payment_failed'
  | 'refund_requested'
  | 'refund_completed'
  | 'webhook_received'
  | 'photo_uploaded'
  | 'music_uploaded'
  | 'image_optimized'
  | 'orphan_cleanup_completed'
  | 'storage_warning'
  | 'ai_generation_requested'
  | 'ai_generation_completed'
  | 'ai_generation_failed'
  | 'template_recommendation_served'
  | 'wish_reaction_added'
  | 'wish_message_added'
  | 'engagement_report_created'
  | 'engagement_hidden'
  | 'notification_sent'
  | 'notification_opened'
  | 'automation_job_executed'
  | 'automation_job_failed'
  | 'email_delivery_failed'
  | 'cache_hit'
  | 'cache_miss'
  | 'worker_failure'
  | 'worker_recovered'
  | 'production_error_logged'
  | 'dashboard_opened'
  | 'admin_action'
  | 'suspicious_login_detected'
  | 'admin_privilege_changed'
  | 'compliance_export_requested'
  | 'account_deletion_requested'
  | 'rate_limit_triggered'
  | 'locale_changed'
  | 'api_key_generated'
  | 'platform_growth_snapshot_generated'
  | 'regional_growth_detected'
  | 'integration_request_created'

export interface AnalyticsEventInput {
  eventName: AnalyticsEventName
  userId?: string | null
  wishId?: string | null
  templateId?: string | null
  metadata?: Record<string, unknown>
}

export interface DailyAnalyticsMetric {
  metric_date: string
  total_daily_views: number
  total_daily_wishes: number
  total_daily_orders: number
  total_daily_revenue: number
  top_template: string
  active_users: number
}

export interface TemplatePerformanceMetric {
  template_id: string
  template_name: string
  template_slug: string
  total_views: number
  total_uses: number
  total_conversions: number
  conversion_rate: number
}
