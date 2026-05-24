import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse } from '../_shared/cors.ts'

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

function paymentEntity(payload: any) {
  return payload?.payload?.payment?.entity ?? null
}

function eventId(req: Request, payload: any) {
  return req.headers.get('x-razorpay-event-id')
    ?? payload?.id
    ?? `${payload?.event ?? 'unknown'}:${paymentEntity(payload)?.id ?? crypto.randomUUID()}`
}

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? Deno.env.get('RAZORPAY_KEY_SECRET')
  if (!secret) return jsonResponse({ error: 'Webhook secret is not configured' }, { status: 500 })

  const expectedSignature = await hmac(secret, rawBody)
  const signatureVerified = timingSafeEqual(expectedSignature, signature)
  if (!signatureVerified) return jsonResponse({ error: 'Invalid webhook signature' }, { status: 400 })

  const payload = JSON.parse(rawBody)
  const provider = 'razorpay'
  const currentEventId = eventId(req, payload)
  const eventType = payload?.event ?? 'unknown'
  const payment = paymentEntity(payload)
  const razorpayOrderId = payment?.order_id ?? null
  const razorpayPaymentId = payment?.id ?? null
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { error: eventInsertError } = await supabase.from('webhook_event_logs').insert({
    provider,
    event_id: currentEventId,
    event_type: eventType,
    payload,
    processed: false,
  })

  if (eventInsertError) {
    if (eventInsertError.code === '23505') {
      await supabase.rpc('increment_webhook_duplicate_count', {
        target_provider: provider,
        target_event_id: currentEventId,
      })
      return jsonResponse({ duplicate: true, processed: false })
    }
    return jsonResponse({ error: eventInsertError.message }, { status: 400 })
  }

  const { data: order } = razorpayOrderId
    ? await supabase
      .from('orders')
      .select('id, wish_id, status, razorpay_order_id')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle()
    : { data: null }

  await supabase.from('payment_audit_logs').insert({
    order_id: order?.id ?? null,
    wish_id: order?.wish_id ?? null,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    event_type: eventType,
    status: payment?.status ?? eventType,
    payload,
    signature_verified: true,
  })

  if (order && eventType === 'payment.captured' && razorpayPaymentId) {
    const { error } = await supabase.rpc('activate_paid_wish', {
      target_order_id: order.id,
      target_wish_id: order.wish_id,
      payment_id: razorpayPaymentId,
      payment_signature: signature,
    })
    if (error) return jsonResponse({ error: error.message }, { status: 400 })
  }

  if (order && (eventType === 'payment.failed' || payment?.status === 'failed')) {
    const { error } = await supabase.rpc('mark_payment_failed', {
      target_order_id: order.id,
      failure_payload: payload,
    })
    if (error) return jsonResponse({ error: error.message }, { status: 400 })
  }

  await supabase
    .from('webhook_event_logs')
    .update({ processed: true })
    .eq('provider', provider)
    .eq('event_id', currentEventId)

  return jsonResponse({ received: true, processed: true })
})
