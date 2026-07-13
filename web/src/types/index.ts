export type TemplateTier = 'free' | 'standard' | 'premium'
export type TemplateStatus = 'draft' | 'review' | 'published' | 'hidden' | 'archived' | 'rejected'
export type TemplateRendererType = 'react-component'
export type { Permission, UserRole } from './roles'
export type OccasionType =
  | 'birthday' | 'wedding' | 'anniversary' | 'festival'
  | 'graduation' | 'baby_shower' | 'farewell' | 'valentine' | 'other'
export type WishStatus = 'draft' | 'active' | 'expired' | 'deleted'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: import('./roles').UserRole
  created_at: string
}

export interface Template {
  id: string
  name: string
  slug: string
  occasion: OccasionType
  tier: TemplateTier
  price_paise: number
  thumbnail_url: string | null
  preview_url: string | null
  has_animation: boolean
  has_music: boolean
  component_name: string
  renderer_type?: TemplateRendererType
  component_key?: string | null
  // External (creator-submitted) templates ship as a JS bundle rather than a
  // registered in-app component. See ExternalTemplateRenderer.
  is_external?: boolean
  bundle_url?: string | null
  manifest_json?: Record<string, unknown> | null
  description?: string | null
  preview_video_url?: string | null
  storage_prefix?: string | null
  is_active: boolean
  creator_id?: string | null
  status?: TemplateStatus
  is_marketplace_template?: boolean
  moderation_notes?: string | null
  published_at?: string | null
  created_at?: string
}

export interface Wish {
  id: string
  user_id: string
  template_id: string
  template_slug?: string | null
  template_version?: string | null
  occasion?: OccasionType | null
  form_data?: Record<string, unknown> | null
  slug: string
  recipient_name: string
  sender_name: string
  custom_message: string | null
  photo_urls: string[]
  music_url: string | null
  status: WishStatus
  is_paid: boolean
  expires_at: string | null
  created_at: string
  activated_at: string | null
  template?: Template
}

export interface Order {
  id: string
  user_id: string
  wish_id: string
  template_id: string
  amount_paise: number
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  status: OrderStatus
  created_at: string
  paid_at: string | null
}

export interface EditorState {
  template: Template | null
  recipientName: string
  senderName: string
  customMessage: string
  photoUrls: string[]
  musicUrl: string | null
  formData: Record<string, unknown>
  useCustomMusic: boolean
}

export interface WishPageData {
  wish: Wish
  template: Template
  isExpired: boolean
}

export interface WishData {
  recipientName: string
  senderName: string
  customMessage: string | null
  photoUrls: string[]
  musicUrl: string | null
  customData?: Record<string, unknown>
}

export interface Review {
  id: string
  user_id: string | null
  rating: number
  review: string | null
  title: string | null
  platform: string
  app_version: string | null
  created_at: string
}

export interface FeatureRequest {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  priority: 'Low' | 'Medium' | 'High'
  status: string
  created_at: string
}

export interface BugReport {
  id: string
  user_id: string
  title: string
  description: string
  page: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  expected_behavior: string
  actual_behavior: string
  screenshot_url: string | null
  status: string
  created_at: string
}
