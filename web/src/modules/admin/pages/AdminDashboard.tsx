import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { fetchAdminMetrics } from '../services/adminMetrics'
import type { AdminMetrics } from '../types'
import { RecentActivity } from '../components/RecentActivity'
import { Users, Sparkles, ShoppingBag, HardDrive } from 'lucide-react'

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-black text-ink dark:text-white">Admin Control Center</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Review platform metrics, resource usage, and overall client engagement activity.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500 bg-white/50 animate-pulse">Loading admin metrics...</Card> : null}

      {!loading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Users Card */}
          <ResponsiveCard className="p-6 bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Platform Users</span>
              <div className="p-2.5 rounded-lg bg-brand/10 text-brand"><Users size={20} /></div>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-black text-ink dark:text-white">{formatCount(metrics.total_users)}</p>
              <p className="text-xs text-zinc-500 mt-1">Total registered users creating memories</p>
            </div>
          </ResponsiveCard>

          {/* Celebrations Card */}
          <ResponsiveCard className="p-6 bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Surprise Wishes</span>
              <div className="p-2.5 rounded-lg bg-mint/10 text-mint"><Sparkles size={20} /></div>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-4xl font-black text-ink dark:text-white">{formatCount(metrics.total_wishes)}</p>
                <p className="text-xs text-zinc-500 mt-1">Total created experiences</p>
              </div>
              <div className="text-right text-xs font-semibold text-zinc-500">
                <p><span className="text-mint">{formatCount(metrics.active_wishes)}</span> active</p>
                <p><span className="text-coral">{formatCount(metrics.expired_wishes)}</span> expired</p>
              </div>
            </div>
          </ResponsiveCard>

          {/* Revenue Card */}
          <ResponsiveCard className="p-6 bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Revenue & Orders</span>
              <div className="p-2.5 rounded-lg bg-sun/10 text-sun"><ShoppingBag size={20} /></div>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-4xl font-black text-ink dark:text-white">{formatMoney(metrics.total_revenue_paise)}</p>
                <p className="text-xs text-zinc-500 mt-1">Platform gross revenue</p>
              </div>
              <div className="text-right text-xs font-semibold text-zinc-500">
                <p><span className="text-brand">{formatCount(metrics.paid_orders)}</span> paid orders</p>
              </div>
            </div>
          </ResponsiveCard>

          {/* Assets & Storage Card */}
          <ResponsiveCard className="p-6 bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Assets & Storage</span>
              <div className="p-2.5 rounded-lg bg-coral/10 text-coral"><HardDrive size={20} /></div>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-4xl font-black text-ink dark:text-white">{formatBytes(metrics.storage_bytes)}</p>
                <p className="text-xs text-zinc-500 mt-1">Total media objects: {formatCount(metrics.storage_objects)}</p>
              </div>
              <div className="text-right text-xs font-semibold text-zinc-500">
                <p><span className="text-brand">{metrics.active_templates}</span> templates active</p>
                <p>out of {metrics.total_templates} total</p>
              </div>
            </div>
          </ResponsiveCard>
        </div>
      )}

      <RecentActivity />
    </div>
  )
}
