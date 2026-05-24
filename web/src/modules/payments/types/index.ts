import type { OrderStatus } from '../../../types'

export interface PaymentHistoryItem {
  id: string
  wish_id: string
  template_id: string
  amount_paise: number
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  status: OrderStatus
  created_at: string
  paid_at: string | null
  wish?: { slug: string; recipient_name: string } | null
  template?: { name: string; slug: string } | null
  refund_requests?: RefundRequest[]
}

export interface RefundRequest {
  id: string
  order_id: string
  user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requested_at: string
  reviewed_at: string | null
}

export interface PaymentReconciliation {
  paid_orders: number
  failed_orders: number
  pending_orders: number
  refund_requests: number
  duplicate_webhooks: number
  total_revenue: number
}

export interface AdminPaymentAuditLog {
  id: string
  order_id: string | null
  wish_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  event_type: string
  status: string
  signature_verified: boolean
  created_at: string
}
