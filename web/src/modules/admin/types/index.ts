import type { Order, Profile, Template, Wish } from '../../../types'

export interface AdminMetrics {
  total_users: number
  total_wishes: number
  active_wishes: number
  expired_wishes: number
  total_orders: number
  paid_orders: number
  total_revenue_paise: number
  total_templates: number
  active_templates: number
  storage_objects: number
  storage_bytes: number
}

export interface AdminActivityLog {
  id: string
  admin_user_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ActivityItem {
  id: string
  label: string
  detail: string
  created_at: string
  tone: 'blue' | 'green' | 'purple' | 'gray'
}

export type AdminTemplate = Template
export type AdminUser = Profile
export type AdminOrder = Order & {
  profile?: Pick<Profile, 'email' | 'full_name'> | null
  wish?: Pick<Wish, 'slug' | 'recipient_name'> | null
  template?: Pick<Template, 'name' | 'slug'> | null
}
