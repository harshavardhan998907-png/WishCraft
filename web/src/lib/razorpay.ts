declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

interface RazorpayCheckoutOptions {
  amount: number
  razorpayOrderId: string
  dbOrderId: string
  userName: string
  userEmail: string
}

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions) {
  await loadRazorpayScript()
  if (!window.Razorpay) throw new Error('Razorpay checkout script is not loaded')

  return new Promise<{ paymentId: string; orderId: string; signature: string; dbOrderId: string }>((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: opts.amount,
      currency: 'INR',
      name: 'Template Hub',
      description: 'Wish page unlock',
      order_id: opts.razorpayOrderId,
      prefill: { name: opts.userName, email: opts.userEmail },
      theme: { color: '#7F77DD' },
      handler: (response: any) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          dbOrderId: opts.dbOrderId,
        })
      },
      modal: { ondismiss: () => reject(new Error('Payment dismissed')) },
    })

    checkout.open()
  })
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
