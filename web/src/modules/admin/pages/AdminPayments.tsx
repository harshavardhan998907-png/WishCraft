import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import {
  fetchAdminPaymentAuditLogs,
  fetchPaymentReconciliation,
  fetchRefundRequests,
  reviewRefundRequest,
} from '../../payments/services/paymentService'
import type { AdminPaymentAuditLog, PaymentReconciliation, RefundRequest } from '../../payments/types'

function formatMoney(paise: number) {
  return `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(paise / 100))}`
}

export function AdminPayments() {
  const [metrics, setMetrics] = useState<PaymentReconciliation | null>(null)
  const [logs, setLogs] = useState<AdminPaymentAuditLog[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busyRefundId, setBusyRefundId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [nextMetrics, nextLogs, nextRefunds] = await Promise.all([
        fetchPaymentReconciliation(),
        fetchAdminPaymentAuditLogs(),
        fetchRefundRequests(),
      ])
      setMetrics(nextMetrics)
      setLogs(nextLogs)
      setRefunds(nextRefunds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payment dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const suspiciousEvents = useMemo(() => logs.filter((log) => !log.signature_verified || log.event_type.includes('failed')), [logs])
  const cards = [
    ['Successful', metrics?.paid_orders ?? 0],
    ['Failed', metrics?.failed_orders ?? 0],
    ['Pending', metrics?.pending_orders ?? 0],
    ['Refunds', metrics?.refund_requests ?? 0],
    ['Suspicious', suspiciousEvents.length],
    ['Revenue', formatMoney(metrics?.total_revenue ?? 0)],
  ]

  async function handleRefund(refundId: string, status: 'approved' | 'rejected' | 'completed') {
    setBusyRefundId(refundId)
    setError(null)
    try {
      await reviewRefundRequest({ refundId, status })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update refund request')
    } finally {
      setBusyRefundId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Payments</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Verified revenue, failed payments, webhook audit trails, and refund review.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading payment dashboard...</Card> : null}

      <ResponsiveGrid columns="metrics">
        {cards.map(([label, value]) => (
          <ResponsiveCard key={label} className="min-h-28 sm:min-h-32">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-4 break-words text-2xl font-black text-ink dark:text-white sm:text-3xl">{value}</p>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-black/10 p-4 dark:border-white/10 sm:p-5">
            <h3 className="text-xl font-black">Payment audit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Signature</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4 font-black">{log.event_type}</td>
                    <td className="px-4 py-4"><Badge tone={log.status.includes('failed') ? 'red' : 'gray'}>{log.status}</Badge></td>
                    <td className="px-4 py-4"><Badge tone={log.signature_verified ? 'green' : 'yellow'}>{log.signature_verified ? 'verified' : 'review'}</Badge></td>
                    <td className="px-4 py-4 break-all font-mono text-xs text-zinc-500">{log.razorpay_payment_id ?? log.razorpay_order_id ?? log.order_id}</td>
                    <td className="px-4 py-4">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!loading && logs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center font-semibold text-zinc-500" colSpan={5}>No payment audit logs yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black">Refund review</h3>
            <Badge tone="gray">{refunds.length}</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {refunds.map((refund) => (
              <div key={refund.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink dark:text-white">{new Date(refund.requested_at).toLocaleDateString()}</p>
                  <Badge tone={refund.status === 'rejected' ? 'red' : refund.status === 'completed' ? 'green' : 'yellow'}>{refund.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{refund.reason}</p>
                {refund.status === 'pending' || refund.status === 'approved' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {refund.status === 'pending' ? <Button size="sm" loading={busyRefundId === refund.id} onClick={() => handleRefund(refund.id, 'approved')}>Approve</Button> : null}
                    <Button size="sm" variant="secondary" loading={busyRefundId === refund.id} onClick={() => handleRefund(refund.id, 'completed')}>Complete</Button>
                    <Button size="sm" variant="danger" loading={busyRefundId === refund.id} onClick={() => handleRefund(refund.id, 'rejected')}>Reject</Button>
                  </div>
                ) : null}
              </div>
            ))}
            {!loading && refunds.length === 0 ? <p className="text-sm text-zinc-500">No refund requests yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
