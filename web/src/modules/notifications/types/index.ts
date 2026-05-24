export interface NotificationItem {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  engagement_enabled: boolean
  creator_updates_enabled: boolean
  payment_notifications_enabled: boolean
  reminder_notifications_enabled: boolean
  created_at: string
}

export interface ScheduledJob {
  id: string
  job_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'
  payload: Record<string, unknown>
  retry_count: number
  scheduled_for: string
  processed_at: string | null
  created_at: string
}

export interface AutomationLog {
  id: string
  job_id: string | null
  execution_status: string
  error_message: string | null
  executed_at: string
}

export interface NotificationMetrics {
  total_notifications: number
  unread_notifications: number
  failed_jobs: number
  engagement_reminders_sent: number
  payment_notifications_sent: number
}
