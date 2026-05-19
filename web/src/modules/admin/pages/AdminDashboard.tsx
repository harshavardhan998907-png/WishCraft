import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { fetchAdminMetrics } from '../services/adminMetrics'
import type { AdminMetrics } from '../types'
import { RecentActivity } from '../components/RecentActivity'

function formatCount(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

function formatMoney(paise: number) {
  return `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(paise / 100))}`
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminMetrics()
      .then(setMetrics)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    ['Total users', metrics ? formatCount(metrics.total_users) : '-'],
    ['Total wishes', metrics ? formatCount(metrics.total_wishes) : '-'],
    ['Active wishes', metrics ? formatCount(metrics.active_wishes) : '-'],
    ['Expired wishes', metrics ? formatCount(metrics.expired_wishes) : '-'],
    ['Paid orders', metrics ? formatCount(metrics.paid_orders) : '-'],
    ['Revenue', metrics ? formatMoney(metrics.total_revenue_paise) : '-'],
    ['Templates', metrics ? `${formatCount(metrics.active_templates)} / ${formatCount(metrics.total_templates)} active` : '-'],
    ['Storage usage', metrics ? `${formatBytes(metrics.storage_bytes)} in ${formatCount(metrics.storage_objects)} files` : '-'],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-ink dark:text-white">Dashboard</h2>
        <p className="mt-2 text-zinc-600 dark:text-white/70">Read-only platform metrics and recent operational activity.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading admin metrics...</Card> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label} className="min-h-32">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-4 text-3xl font-black text-ink dark:text-white">{value}</p>
          </Card>
        ))}
      </div>

      <RecentActivity />
    </div>
  )
}
