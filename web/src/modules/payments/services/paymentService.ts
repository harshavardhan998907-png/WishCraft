import { supabase } from '../../../lib/supabase'
import { openRazorpayCheckout } from '../../../lib/razorpay'
import { trackEvent, trackPaymentFailed, trackPaymentSuccess } from '../../analytics/services/analyticsService'
import { createSelfNotification } from '../../notifications/services/notificationService'
import { logSecurityAudit, trackPrivilegedAction } from '../../security/services/governanceService'
import type { AdminPaymentAuditLog, PaymentHistoryItem, PaymentReconciliation, RefundRequest } from '../types'
import { getCsrfToken } from '../../../lib/csrf'

interface StartPaymentInput {
  amount: number
  wishId: string
  templateId: string
  userName: string
  userEmail: string
}

interface VerifiedPayment {
  paymentId: string
  orderId: string
  signature: string
  dbOrderId: string
}

function paymentBackendError(error: { message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('failed to send a request') || message.includes('function') || message.includes('not found')) {
    return new Error('Payment backend is not deployed yet. Deploy the payment Edge Functions and set their secrets.')
  }
  return new Error(error.message || 'Payment request failed')
}

export async function createPaymentOrder(input: Pick<StartPaymentInput, 'amount' | 'wishId' | 'templateId'>) {
  void logSecurityAudit({
    eventType: 'payment_order_requested',
    targetType: 'wish',
    targetId: input.wishId,
    riskLevel: 'medium',
    metadata: { amount: input.amount, template_id: input.templateId },
  }).catch((error) => console.warn('[Governance] payment order audit failed', error))

  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount: input.amount, wishId: input.wishId, templateId: input.templateId },
    headers: { 'X-CSRF-Token': getCsrfToken() },
  })

  if (error) throw paymentBackendError(error)
  if (!data?.razorpay_order_id || !data?.order_id) throw new Error('Payment backend returned an invalid order response')
  return data as { order_id: string; razorpay_order_id: string }
}

export async function verifyPayment(input: VerifiedPayment & { wishId: string; templateId: string }) {
  const { error } = await supabase.functions.invoke('verify-payment', {
    body: {
      paymentId: input.paymentId,
      orderId: input.orderId,
      signature: input.signature,
      dbOrderId: input.dbOrderId,
      wishId: input.wishId,
    },
    headers: { 'X-CSRF-Token': getCsrfToken() },
  })
  if (error) throw paymentBackendError(error)
  void logSecurityAudit({
    eventType: 'payment_verification_requested',
    targetType: 'order',
    targetId: input.dbOrderId,
    riskLevel: 'medium',
    metadata: { wish_id: input.wishId, template_id: input.templateId },
  }).catch((auditError) => console.warn('[Governance] payment verification audit failed', auditError))
  trackPaymentSuccess({ wishId: input.wishId, templateId: input.templateId, orderId: input.dbOrderId, paymentId: input.paymentId })
  void createSelfNotification({
    type: 'payment_confirmation',
    title: 'Payment confirmed',
    message: 'Your wish payment was verified and the wish is now active.',
    metadata: { wish_id: input.wishId, template_id: input.templateId, order_id: input.dbOrderId, payment_id: input.paymentId },
  })
}

export async function startPayment(input: StartPaymentInput) {
  const order = await createPaymentOrder(input)
  return openRazorpayCheckout({
    amount: input.amount,
    razorpayOrderId: order.razorpay_order_id,
    dbOrderId: order.order_id,
    userName: input.userName,
    userEmail: input.userEmail,
  })
}

export async function markPaymentFailed(input: { orderId?: string; wishId?: string; templateId?: string; reason: string }) {
  void logSecurityAudit({
    eventType: 'payment_failed',
    targetType: input.orderId ? 'order' : 'wish',
    targetId: input.orderId ?? input.wishId,
    riskLevel: 'medium',
    metadata: { wish_id: input.wishId, template_id: input.templateId, reason: input.reason },
  }).catch((error) => console.warn('[Governance] payment failure audit failed', error))
  trackPaymentFailed({ wishId: input.wishId, templateId: input.templateId, reason: input.reason })
  void createSelfNotification({
    type: 'payment_failed',
    title: 'Payment not completed',
    message: 'Your payment was not completed. You can retry safely from payment history.',
    metadata: { order_id: input.orderId, wish_id: input.wishId, template_id: input.templateId, reason: input.reason },
  })
}

export async function fetchPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, wish:wishes(slug, recipient_name), template:templates(name, slug), refund_requests(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as PaymentHistoryItem[]
}

export async function requestRefund(orderId: string, reason: string) {
  const { data, error } = await supabase.rpc('request_refund', {
    target_order_id: orderId,
    refund_reason: reason,
  })
  if (error) throw new Error(error.message)
  void trackEvent({ eventName: 'refund_requested', metadata: { order_id: orderId } })
  void logSecurityAudit({
    eventType: 'refund_requested',
    targetType: 'order',
    targetId: orderId,
    riskLevel: 'medium',
    metadata: { reason },
  }).catch((auditError) => console.warn('[Governance] refund request audit failed', auditError))
  void createSelfNotification({
    type: 'refund_update',
    title: 'Refund request received',
    message: 'Your refund request has been recorded and is waiting for review.',
    metadata: { order_id: orderId },
  })
  return data as string
}

export async function fetchRefundRequests(): Promise<RefundRequest[]> {
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as RefundRequest[]
}

export async function reviewRefundRequest(input: { refundId: string; status: 'approved' | 'rejected' | 'completed' }) {
  const { data: refund, error } = await supabase
    .from('refund_requests')
    .update({ status: input.status, reviewed_at: new Date().toISOString() })
    .eq('id', input.refundId)
    .select('id, order_id')
    .single()

  if (error) throw new Error(error.message)
  void trackPrivilegedAction({
    eventType: input.status === 'completed' ? 'refund_completed' : 'refund_reviewed',
    targetType: 'refund_request',
    targetId: input.refundId,
    metadata: { status: input.status, order_id: refund.order_id },
  }).catch((auditError) => console.warn('[Governance] refund review audit failed', auditError))
  if (input.status === 'completed') {
    await supabase.from('orders').update({ status: 'refunded' }).eq('id', refund.order_id)
    await supabase
      .from('payment_audit_logs')
      .insert({ order_id: refund.order_id, event_type: 'refund_completed', status: 'completed', payload: { refund_id: refund.id }, signature_verified: false })
    void trackEvent({ eventName: 'refund_completed', metadata: { order_id: refund.order_id, refund_id: refund.id } })
  }
}

export async function fetchPaymentReconciliation(): Promise<PaymentReconciliation> {
  const { data, error } = await supabase
    .from('payment_reconciliation_view')
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as PaymentReconciliation
}

export async function fetchAdminPaymentAuditLogs(): Promise<AdminPaymentAuditLog[]> {
  const { data, error } = await supabase
    .from('payment_audit_logs')
    .select('id, order_id, wish_id, razorpay_order_id, razorpay_payment_id, event_type, status, signature_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminPaymentAuditLog[]
}
