import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

    const { orderId, paymentId, signature, dbOrderId, wishId } = await req.json()
    console.info('[verify-payment] request payload', { orderId, paymentId, dbOrderId, wishId, hasSignature: Boolean(signature) })
    if (!orderId || !paymentId || !signature || !dbOrderId || !wishId) {
      return jsonResponse({ error: 'orderId, paymentId, signature, dbOrderId, and wishId are required' }, { status: 400 })
    }

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!secret) {
      console.error('[verify-payment] missing RAZORPAY_KEY_SECRET')
      return jsonResponse({ error: 'Missing secret' }, { status: 500 })
    }
    const expectedSignature = await hmac(secret, `${orderId}|${paymentId}`)
    if (expectedSignature !== signature) {
      console.warn('[verify-payment] invalid signature', { orderId, paymentId, dbOrderId, wishId })
      return jsonResponse({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, wish_id, razorpay_order_id, status')
      .eq('id', dbOrderId)
      .single()
    if (orderError || !order) {
      console.warn('[verify-payment] database order not found', { dbOrderId, orderError })
      return jsonResponse({ error: 'Order not found' }, { status: 400 })
    }
    if (order.wish_id !== wishId || order.razorpay_order_id !== orderId || order.status !== 'pending') {
      console.warn('[verify-payment] order mismatch', {
        dbOrderId,
        wishId,
        orderId,
        storedWishId: order.wish_id,
        storedRazorpayOrderId: order.razorpay_order_id,
        storedStatus: order.status,
      })
      return jsonResponse({ error: 'Order does not match payment payload' }, { status: 400 })
    }

    const { error } = await supabase.rpc('activate_paid_wish', {
      target_order_id: dbOrderId,
      target_wish_id: wishId,
      payment_id: paymentId,
      payment_signature: signature,
    })

    console.info('[verify-payment] activation result', { error, dbOrderId, wishId })
    if (error) return jsonResponse({ error: error.message }, { status: 400 })
    return jsonResponse({ verified: true })
  } catch (error) {
    console.error('[verify-payment] unhandled error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to verify payment' }, { status: 500 })
  }
})
