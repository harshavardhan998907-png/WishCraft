import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { useAuth } from '../../../hooks/useAuth'
import { fetchPaymentHistory, markPaymentFailed, requestRefund, startPayment, verifyPayment } from '../services/paymentService'
import type { PaymentHistoryItem } from '../types'
import { CreditCard } from 'lucide-react'

function formatMoney(paise: number) {
  return `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(paise / 100))}`
}

function statusTone(status: PaymentHistoryItem['status']): 'green' | 'red' | 'yellow' | 'gray' {
  if (status === 'paid') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'refunded') return 'yellow'
  return 'gray'
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [retryOrderId, setRetryOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  async function loadPayments() {
    setLoading(true)
    setError(null)
    try {
      setPayments(await fetchPaymentHistory())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payment history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPayments()
  }, [])

  const selectedPayment = useMemo(() => payments.find((payment) => payment.id === refundOrderId), [payments, refundOrderId])

  async function handleRefundSubmit(event: FormEvent) {
    event.preventDefault()
    if (!refundOrderId || !refundReason.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      await requestRefund(refundOrderId, refundReason.trim())
      setRefundOrderId(null)
      setRefundReason('')
      await loadPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request refund')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRetry(payment: PaymentHistoryItem) {
    setRetryOrderId(payment.id)
    setError(null)
    try {
      const result = await startPayment({
        amount: payment.amount_paise,
        wishId: payment.wish_id,
        templateId: payment.template_id,
        userName: profile?.full_name ?? payment.wish?.recipient_name ?? 'Template Hub user',
        userEmail: user?.email ?? '',
      })
      await verifyPayment({ ...result, wishId: payment.wish_id, templateId: payment.template_id })
      if (payment.wish?.slug) navigate(`/share/${payment.wish.slug}`)
      else await loadPayments()
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Payment retry failed'
      await markPaymentFailed({ wishId: payment.wish_id, templateId: payment.template_id, reason })
      setError(reason)
    } finally {
      setRetryOrderId(null)
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Payment history</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Your orders, payment status, and refund requests.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading payments...</Card> : null}

      <div className="grid gap-4">
        {payments.map((payment) => {
          const refund = payment.refund_requests?.[0]
          return (
            <ResponsiveCard key={payment.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 break-words text-lg font-black text-ink dark:text-white">{payment.template?.name ?? 'Wish payment'}</h2>
                  <Badge tone={statusTone(payment.status)}>{payment.status}</Badge>
                  {refund ? <Badge tone={refund.status === 'rejected' ? 'red' : 'yellow'}>{refund.status} refund</Badge> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-500">{payment.wish?.recipient_name ?? 'Recipient unavailable'}</p>
                <p className="mt-2 break-all font-mono text-xs text-zinc-500">{payment.razorpay_payment_id ?? payment.razorpay_order_id ?? payment.id}</p>
              </div>
              <div className="flex flex-col items-start gap-3 lg:items-end">
                <div className="text-left lg:text-right">
                  <p className="text-xl font-black text-ink dark:text-white sm:text-2xl">{formatMoney(payment.amount_paise)}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-500">{new Date(payment.paid_at ?? payment.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {payment.wish?.slug ? <Link to={`/share/${payment.wish.slug}`}><Button variant="ghost" size="sm">Open</Button></Link> : null}
                  {payment.status === 'failed' || payment.status === 'pending' ? <Button size="sm" loading={retryOrderId === payment.id} onClick={() => handleRetry(payment)}>Retry</Button> : null}
                  {payment.status === 'paid' && !refund ? <Button variant="secondary" size="sm" onClick={() => setRefundOrderId(payment.id)}>Refund</Button> : null}
                </div>
              </div>
            </ResponsiveCard>
          )
        })}
        {!loading && payments.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-ink/50 mt-4">
            <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-black text-ink dark:text-white mb-1">No payment history</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm">
              You haven't purchased or created any premium wishes yet.
            </p>
            <Button onClick={() => navigate('/browse')} className="mt-6 rounded-xl px-6">
              Explore Templates
            </Button>
          </div>
        ) : null}
      </div>

      {refundOrderId ? (
        <Card>
          <form className="space-y-4" onSubmit={handleRefundSubmit}>
            <div>
              <h2 className="text-xl font-black text-ink dark:text-white">Refund request</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">{selectedPayment?.template?.name ?? 'Selected payment'}</p>
            </div>
            <Input label="Reason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Tell us what happened" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={submitting}>Submit request</Button>
              <Button type="button" variant="ghost" onClick={() => setRefundOrderId(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : null}
    </section>
  )
}
