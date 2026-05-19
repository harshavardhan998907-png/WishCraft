import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Razorpay from 'npm:razorpay'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

    const hasRequiredEnv = Boolean(Deno.env.get('SUPABASE_URL') && Deno.env.get('SUPABASE_ANON_KEY') && Deno.env.get('RAZORPAY_KEY_ID') && Deno.env.get('RAZORPAY_KEY_SECRET'))
    console.info('[create-razorpay-order] request received', { method: req.method, hasRequiredEnv })

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      console.warn('[create-razorpay-order] unauthorized request', { userError })
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, wishId, templateId } = await req.json()
    console.info('[create-razorpay-order] payload', { amount, wishId, templateId, userId: userData.user.id })
    if (!amount || !wishId || !templateId) {
      return jsonResponse({ error: 'amount, wishId, and templateId are required' }, { status: 400 })
    }

    const { data: wish, error: wishError } = await supabase
      .from('wishes')
      .select('id, user_id, template_id, status')
      .eq('id', wishId)
      .eq('user_id', userData.user.id)
      .eq('template_id', templateId)
      .single()
    if (wishError || !wish) {
      console.warn('[create-razorpay-order] wish lookup failed', { wishId, templateId, userId: userData.user.id, wishError })
      return jsonResponse({ error: 'Draft wish not found for this user and template' }, { status: 400 })
    }
    if (wish.status !== 'draft') {
      console.warn('[create-razorpay-order] wish is not payable draft', { wishId, status: wish.status })
      return jsonResponse({ error: 'Only draft wishes can be paid' }, { status: 400 })
    }

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id, price_paise')
      .eq('id', templateId)
      .single()
    if (templateError || !template) {
      console.warn('[create-razorpay-order] template lookup failed', { templateId, templateError })
      return jsonResponse({ error: 'Template not found' }, { status: 400 })
    }
    if (template.price_paise !== amount) {
      console.warn('[create-razorpay-order] amount mismatch', { templateId, expected: template.price_paise, received: amount })
      return jsonResponse({ error: 'Payment amount does not match template price' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
    })

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: wishId,
    })
    console.info('[create-razorpay-order] Razorpay order created', { razorpayOrderId: order.id })

    const { data: dbOrder, error: orderError } = await supabase.from('orders').insert({
      user_id: userData.user.id,
      wish_id: wishId,
      template_id: templateId,
      amount_paise: amount,
      razorpay_order_id: order.id,
      status: 'pending',
    }).select('*').single()

    console.info('[create-razorpay-order] database order insert result', { dbOrderId: dbOrder?.id, orderError })
    if (orderError) return jsonResponse({ error: orderError.message }, { status: 400 })

    return jsonResponse({
      order_id: dbOrder.id,
      razorpay_order_id: order.id,
    })
  } catch (error) {
    console.error('[create-razorpay-order] unhandled error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to create Razorpay order' }, { status: 500 })
  }
})
