import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { fetchDailyAnalytics, fetchTemplatePerformance, trackDashboardAction } from '../../analytics/services/analyticsService'
import type { DailyAnalyticsMetric, TemplatePerformanceMetric } from '../../analytics/types'

function formatCount(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

function formatMoney(paise: number) {
  return `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(paise / 100))}`
}

export function AdminAnalytics() {
  const [dailyMetrics, setDailyMetrics] = useState<DailyAnalyticsMetric[]>([])
  const [templateMetrics, setTemplateMetrics] = useState<TemplatePerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackDashboardAction({ action: 'analytics_opened' })
    Promise.all([fetchDailyAnalytics(), fetchTemplatePerformance()])
      .then(([daily, templates]) => {
        setDailyMetrics(daily)
        setTemplateMetrics(templates)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const views = dailyMetrics.reduce((total, item) => total + item.total_daily_views, 0)
    const wishes = dailyMetrics.reduce((total, item) => total + item.total_daily_wishes, 0)
    const orders = dailyMetrics.reduce((total, item) => total + item.total_daily_orders, 0)
    const revenue = dailyMetrics.reduce((total, item) => total + item.total_daily_revenue, 0)
    return { views, wishes, orders, revenue }
  }, [dailyMetrics])

  const cards = [
    ['Wish opens', formatCount(summary.views)],
    ['New wishes', formatCount(summary.wishes)],
    ['Orders', formatCount(summary.orders)],
    ['Revenue', formatMoney(summary.revenue)],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Analytics</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">
          Engagement, conversion, traffic, and template performance insights.
        </p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading analytics...</Card> : null}

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
            <h3 className="text-xl font-black">Daily traffic and revenue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Wishes</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Top template</th>
                  <th className="px-4 py-3">Active users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {dailyMetrics.map((metric) => (
                  <tr key={metric.metric_date}>
                    <td className="px-4 py-4 font-semibold">{new Date(metric.metric_date).toLocaleDateString()}</td>
                    <td className="px-4 py-4">{formatCount(metric.total_daily_views)}</td>
                    <td className="px-4 py-4">{formatCount(metric.total_daily_wishes)}</td>
                    <td className="px-4 py-4">{formatCount(metric.total_daily_orders)}</td>
                    <td className="px-4 py-4 font-black">{formatMoney(metric.total_daily_revenue)}</td>
                    <td className="px-4 py-4">{metric.top_template}</td>
                    <td className="px-4 py-4">{formatCount(metric.active_users)}</td>
                  </tr>
                ))}
                {!loading && dailyMetrics.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center font-semibold text-zinc-500" colSpan={7}>No analytics data yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black">Top templates</h3>
            <Badge tone="gray">{templateMetrics.length}</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {templateMetrics.map((template) => (
              <div key={template.template_id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink dark:text-white">{template.template_name}</p>
                  <Badge tone={template.conversion_rate > 0 ? 'green' : 'gray'}>{template.conversion_rate}%</Badge>
                </div>
                <p className="mt-1 break-all text-xs font-semibold text-zinc-500">{template.template_slug}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-md bg-zinc-100 p-2 dark:bg-white/10">
                    <p className="font-black">{formatCount(template.total_views)}</p>
                    <p className="text-xs text-zinc-500">views</p>
                  </div>
                  <div className="rounded-md bg-zinc-100 p-2 dark:bg-white/10">
                    <p className="font-black">{formatCount(template.total_uses)}</p>
                    <p className="text-xs text-zinc-500">uses</p>
                  </div>
                  <div className="rounded-md bg-zinc-100 p-2 dark:bg-white/10">
                    <p className="font-black">{formatCount(template.total_conversions)}</p>
                    <p className="text-xs text-zinc-500">paid</p>
                  </div>
                </div>
              </div>
            ))}
            {!loading && templateMetrics.length === 0 ? <p className="text-sm text-zinc-500">No template performance data yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
