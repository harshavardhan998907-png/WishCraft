export type TemplateTier = 'free' | 'standard' | 'premium'
export type OccasionType = 'birthday' | 'wedding' | 'anniversary' | 'festival' | 'graduation' | 'baby_shower' | 'farewell' | 'valentine' | 'other'
export type WishStatus = 'draft' | 'active' | 'expired' | 'deleted'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

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
  is_active: boolean
}

export interface Wish {
  id: string
  user_id: string
  template_id: string
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
