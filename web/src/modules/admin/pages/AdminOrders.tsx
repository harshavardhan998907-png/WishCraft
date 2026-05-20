import { useEffect, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { fetchAdminOrders } from '../services/adminOrders'
import type { AdminOrder } from '../types'

function formatMoney(paise: number) {
  return `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(paise / 100))}`
}

function orderTone(status: AdminOrder['status']): 'green' | 'red' | 'yellow' | 'gray' {
  if (status === 'paid') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'refunded') return 'yellow'
  return 'gray'
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      fetchAdminOrders(search)
        .then(setOrders)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false))
    }, 200)

    return () => window.clearTimeout(timer)
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Orders</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Read-only payment and wish order visibility.</p>
        </div>
        <div className="w-full md:w-80">
          <Input label="Search orders" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Payment, email, recipient" />
        </div>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading orders...</Card> : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <ResponsiveCard key={order.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-lg font-black text-ink dark:text-white">{order.template?.name ?? 'Template order'}</h3>
                <Badge tone={orderTone(order.status)}>{order.status}</Badge>
              </div>
              <p className="mt-2 break-words text-sm font-semibold text-zinc-500">{order.profile?.email ?? 'Unknown user'} - {order.wish?.recipient_name ?? 'No recipient'}</p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-500">{order.razorpay_order_id ?? order.id}</p>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-xl font-black text-ink dark:text-white sm:text-2xl">{formatMoney(order.amount_paise)}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </ResponsiveCard>
        ))}
        {!loading && orders.length === 0 ? <Card className="text-center font-semibold text-zinc-500">No orders found.</Card> : null}
      </div>
    </div>
  )
}
