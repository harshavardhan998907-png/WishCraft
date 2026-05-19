import { supabase } from './supabase'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

interface RazorpayOptions {
  amount: number
  wishId: string
  templateId: string
  userName: string
  userEmail: string
  onSuccess: (paymentId: string, orderId: string, signature: string, dbOrderId: string) => void
  onFailure: (error: unknown) => void
}

export async function initiatePayment(opts: RazorpayOptions) {
  await loadRazorpayScript()
  const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount: opts.amount, wishId: opts.wishId, templateId: opts.templateId },
  })

  if (error) {
    console.error('[Razorpay] create-razorpay-order failed', { error, amount: opts.amount, wishId: opts.wishId, templateId: opts.templateId })
    const message = error.message?.toLowerCase() ?? ''
    if (message.includes('failed to send a request') || message.includes('function') || message.includes('not found')) {
      throw new Error('Payment backend is not deployed yet. Deploy the create-razorpay-order Edge Function and set its secrets.')
    }
    throw new Error(error.message || 'Could not create payment order')
  }
  console.info('[Razorpay] create-razorpay-order response', { order })
  if (!order?.razorpay_order_id || !order?.order_id) {
    console.error('[Razorpay] create-razorpay-order returned an invalid response', { order })
    throw new Error('Payment backend returned an invalid order response')
  }
  if (!window.Razorpay) throw new Error('Razorpay checkout script is not loaded')

  const checkout = new window.Razorpay({
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: opts.amount,
    currency: 'INR',
    name: 'Template Hub',
    description: 'Wish page unlock',
    order_id: order.razorpay_order_id,
    prefill: { name: opts.userName, email: opts.userEmail },
    theme: { color: '#7F77DD' },
    handler: (response: any) => {
      opts.onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature, order.order_id)
    },
    modal: { ondismiss: () => opts.onFailure(new Error('Payment dismissed')) },
  })

  checkout.open()
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'))
    document.head.appendChild(script)
  })
}
