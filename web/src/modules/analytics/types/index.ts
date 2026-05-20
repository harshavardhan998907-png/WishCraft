export type AnalyticsEventName =
  | 'wish_opened'
  | 'wish_shared'
  | 'template_selected'
  | 'payment_success'
  | 'payment_failed'
  | 'photo_uploaded'
  | 'music_uploaded'
  | 'dashboard_opened'
  | 'admin_action'

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
