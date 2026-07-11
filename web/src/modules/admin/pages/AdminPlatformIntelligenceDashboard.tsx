import { useEffect, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import { fetchGlobalGrowthMetrics, fetchPlatformIntelligenceMetrics, generatePlatformGrowthSnapshot } from '../services/platformIntelligenceService'
import type { GlobalGrowthMetrics, PlatformIntelligenceMetric } from '../services/platformIntelligenceService'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function AdminPlatformIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<GlobalGrowthMetrics | null>(null)
  const [snapshots, setSnapshots] = useState<PlatformIntelligenceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [nextMetrics, nextSnapshots] = await Promise.all([
      fetchGlobalGrowthMetrics(),
      fetchPlatformIntelligenceMetrics(),
    ])
    setMetrics(nextMetrics)
    setSnapshots(nextSnapshots)
  }

  useEffect(() => {
    load()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function generateSnapshot() {
    setGenerating(true)
    try {
      await generatePlatformGrowthSnapshot()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate snapshot')
    } finally {
      setGenerating(false)
    }
  }

  const cards = [
    ['Creator growth', metrics?.creator_growth ?? 0],
    ['Engagement growth', metrics?.engagement_growth ?? 0],
    ['AI usage growth', metrics?.ai_usage_growth ?? 0],
    ['Revenue growth', formatCurrency(metrics?.revenue_growth ?? 0)],
    ['Active ecosystem keys', metrics?.active_ecosystem_keys ?? 0],
    ['Ecosystem usage', metrics?.ecosystem_usage ?? 0],
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Platform intelligence</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Regional growth, creator intelligence, engagement, AI usage, retention, and ecosystem usage from the central analytics layer.</p>
        </div>
        <Button type="button" loading={generating} onClick={generateSnapshot}>Generate snapshot</Button>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading platform intelligence...</Card> : null}

      <ResponsiveGrid columns="metrics">
        {cards.map(([label, value]) => (
          <ResponsiveCard key={label} className="min-h-28 sm:min-h-32">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-4 break-words text-2xl font-black text-ink dark:text-white sm:text-3xl">{value}</p>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <h3 className="text-xl font-black">Regional growth</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(metrics?.growth_by_region ?? {}).map(([region, value]) => (
              <div key={region} className="rounded-md border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black capitalize">{region}</p>
                  <Badge tone="blue">{value}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black">Retention</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
              <p className="text-sm font-bold text-zinc-500">Active users 30d</p>
              <p className="mt-2 text-2xl font-black">{metrics?.retention_metrics?.active_users_30d ?? 0}</p>
            </div>
            <div className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
              <p className="text-sm font-bold text-zinc-500">Returning users 30d</p>
              <p className="mt-2 text-2xl font-black">{metrics?.retention_metrics?.returning_users_30d ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-black">Strategic snapshots</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr><th className="py-2">Metric</th><th>Category</th><th>Value</th><th>Generated</th></tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="py-3 font-bold">{snapshot.metric_name}</td>
                  <td><Badge tone="gray">{snapshot.metric_category}</Badge></td>
                  <td>{snapshot.metric_value}</td>
                  <td>{new Date(snapshot.generated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {snapshots.length === 0 ? <p className="py-4 text-sm font-semibold text-zinc-500">No platform snapshots yet.</p> : null}
        </div>
      </Card>
    </div>
  )
}
